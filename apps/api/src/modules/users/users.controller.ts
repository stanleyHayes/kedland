import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { withImpliedReads } from "@kedland/types";

import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { badRequest } from "../../common/http/bad-request";
import { MailService } from "../mail/mail.service";
import { RolesService } from "../roles/roles.service";

import {
  assignRoleSchema,
  inviteUserSchema,
  newUserSchema,
  setPermissionsSchema,
  setStatusSchema,
} from "./dto/user.dto";
import { UsersService } from "./users.service";

import type { UserDocument } from "./schemas/user.schema";
import type { StaffAccount } from "@kedland/types";

/**
 * Staff accounts.
 *
 * Two ways in, because the school asked for both (§9 of the brief): **create**,
 * where the administrator sets a password and hands it over, and **invite**,
 * where the person sets their own from an emailed link. Invitation is the better
 * habit — a password the administrator knows is a password two people know — but
 * it needs working mail, and creating directly is the fallback when mail is not
 * configured yet.
 *
 * Permissions here are always resolved from a role at the moment of creation and
 * are the account's own afterwards. `PATCH :id/permissions` edits one account
 * without touching the role; `PATCH :id/role` moves the account to a different
 * role and re-adopts that role's list.
 */
@ApiTags("users")
@Controller("admin/users")
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly roles: RolesService,
    private readonly mail: MailService,
  ) {}

  @Get()
  @RequirePermission("users", "read")
  @ApiOperation({ summary: "Every staff account" })
  async list(): Promise<StaffAccount[]> {
    const accounts = await this.users.findAll();
    return accounts.map(toDto);
  }

  @Get(":id")
  @RequirePermission("users", "read")
  @ApiOperation({ summary: "One staff account" })
  async findOne(@Param("id") id: string): Promise<StaffAccount> {
    return toDto(await this.users.findByIdOrFail(id));
  }

  @Post()
  @RequirePermission("users", "create")
  @ApiOperation({ summary: "Create an account with a password you set" })
  async create(@Body() raw: unknown): Promise<StaffAccount> {
    const parsed = newUserSchema.safeParse(raw);
    if (!parsed.success) throw badRequest(parsed.error.issues);

    const permissions = await this.roles.permissionsForSlug(parsed.data.roleSlug);

    return toDto(
      await this.users.create({
        email: parsed.data.email,
        password: parsed.data.password,
        displayName: parsed.data.displayName,
        roleSlug: parsed.data.roleSlug,
        permissions,
      }),
    );
  }

  /**
   * Invites someone.
   *
   * The account holds its permissions immediately but has no usable password: a
   * random one is set that nobody has ever seen, and the invitee replaces it
   * through the reset flow. Deliberately the *same* flow as "forgot password", so
   * there is one way to set a password rather than two that can drift apart.
   *
   * All of it succeeds or none of it does. If the invitation cannot be sent the
   * account is removed again — see the rollback below for why a half-invited
   * account is worse than no account at all.
   */
  @Post("invite")
  @RequirePermission("users", "create")
  @ApiOperation({ summary: "Invite someone to set their own password" })
  async invite(@Body() raw: unknown): Promise<StaffAccount> {
    const parsed = inviteUserSchema.safeParse(raw);
    if (!parsed.success) throw badRequest(parsed.error.issues);

    if (!this.mail.isConfigured()) {
      // Fail loudly rather than create an account whose invitation silently
      // never arrives. The person would be left unable to sign in, with an
      // administrator who believes they have been invited.
      throw new BadRequestException(
        "Email is not configured, so an invitation cannot be sent. Create the account with a password instead.",
      );
    }

    const permissions = await this.roles.permissionsForSlug(parsed.data.roleSlug);

    const user = await this.users.create({
      email: parsed.data.email,
      displayName: parsed.data.displayName,
      roleSlug: parsed.data.roleSlug,
      permissions,
      // Unguessable and never shown. The invitee never uses it; the reset token
      // below is what lets them in.
      password: UsersService.randomPassword(),
      isInvited: true,
    });

    const token = await this.users.createPasswordResetToken(user.id);

    try {
      await this.mail.sendInvitation({ to: user.email, displayName: user.displayName, token });
    } catch (error) {
      /*
       * Inviting somebody is one operation, so a failure leaves nothing behind.
       *
       * Without this the account survives an undeliverable invitation, and the
       * administrator is left in a dead end: they saw an error, so they try
       * again, and the retry is refused because the address already exists. The
       * only way out is to notice the half-made account in the list and delete
       * it — which requires knowing that is what happened.
       *
       * Rolling back is safe because the mail service throws only when it is
       * certain nothing was sent: an unconfigured mailer, or a refusal from
       * Resend. It never throws after a successful send.
       */
      await this.users.deleteForRollback(user.id);

      // 502, not 500: the API worked, the mail provider refused. And the message
      // says what to do instead, because "Internal Server Error" told the office
      // nothing at all.
      throw new ServiceUnavailableException(
        `The invitation to ${user.email} could not be sent, so no account was created. ` +
          `Check the Resend API key and that the sending domain is verified, or create the ` +
          `account with a password instead. (${error instanceof Error ? error.message : "unknown error"})`,
      );
    }

    return toDto(user);
  }

  /**
   * Replaces one account's permissions, leaving its role alone.
   *
   * This is §5 of the brief: an administrator can give one person more or less
   * than their role without changing what the role means for anyone else.
   */
  @Patch(":id/permissions")
  @RequirePermission("users", "update")
  @ApiOperation({ summary: "Change what one account may do" })
  async setPermissions(@Param("id") id: string, @Body() raw: unknown): Promise<StaffAccount> {
    const parsed = setPermissionsSchema.safeParse(raw);
    if (!parsed.success) throw badRequest(parsed.error.issues);

    return toDto(await this.users.setPermissions(id, parsed.data.permissions));
  }

  @Patch(":id/role")
  @RequirePermission("users", "update")
  @ApiOperation({ summary: "Move an account to a different role, adopting its permissions" })
  async assignRole(@Param("id") id: string, @Body() raw: unknown): Promise<StaffAccount> {
    const parsed = assignRoleSchema.safeParse(raw);
    if (!parsed.success) throw badRequest(parsed.error.issues);

    const permissions = await this.roles.permissionsForSlug(parsed.data.roleSlug);

    return toDto(await this.users.assignRole(id, parsed.data.roleSlug, permissions));
  }

  @Patch(":id/status")
  @RequirePermission("users", "update")
  @ApiOperation({ summary: "Suspend or restore an account" })
  async setStatus(
    @Param("id") id: string,
    @Body() raw: unknown,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StaffAccount> {
    const parsed = setStatusSchema.safeParse(raw);
    if (!parsed.success) throw badRequest(parsed.error.issues);

    // Suspending yourself signs you out mid-click and cannot be undone by you.
    // The last-account-manager check in the service would not catch it whenever
    // a second manager exists.
    if (id === actor.id && parsed.data.status === "suspended") {
      throw new BadRequestException("You cannot suspend your own account");
    }

    return toDto(await this.users.setStatus(id, parsed.data.status));
  }

  @Delete(":id")
  @RequirePermission("users", "delete")
  @HttpCode(204)
  @ApiOperation({ summary: "Remove an account" })
  async remove(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser): Promise<void> {
    if (id === actor.id) {
      throw new BadRequestException("You cannot remove your own account");
    }

    await this.users.remove(id);
  }
}

/** The password hash is `select: false`, so it cannot leak through here. */
function toDto(user: UserDocument): StaffAccount {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    roleSlug: user.roleSlug,
    permissions: withImpliedReads(user.permissions),
    status: user.status,
    isInvited: user.isInvited,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}
