import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import {
  ACTION_LABELS,
  ALL_PERMISSIONS,
  RESOURCE_LABELS,
  roleInputSchema,
  roleUpdateSchema,
  type Role as RoleDto,
} from "@kedland/types";

import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { badRequest } from "../../common/http/bad-request";

import { RolesService } from "./roles.service";

import type { RoleDocument } from "./schemas/role.schema";

/**
 * Roles and the permission vocabulary.
 *
 * The catalogue endpoint exists so the dashboard's permission editor is built
 * from the API's idea of what permissions there are, not from a second list
 * maintained by hand in the front end. A resource added here appears there
 * without anyone remembering to add it.
 */
@ApiTags("roles")
@Controller("admin/roles")
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get("catalogue")
  @RequirePermission("roles", "read")
  @ApiOperation({ summary: "Every permission the system can express, with labels" })
  catalogue(): {
    permissions: readonly string[];
    resourceLabels: Record<string, string>;
    actionLabels: Record<string, string>;
  } {
    return {
      permissions: ALL_PERMISSIONS,
      resourceLabels: RESOURCE_LABELS,
      actionLabels: ACTION_LABELS,
    };
  }

  @Get()
  @RequirePermission("roles", "read")
  @ApiOperation({ summary: "Every role" })
  async list(): Promise<RoleDto[]> {
    const roles = await this.roles.findAll();
    return roles.map(toDto);
  }

  @Post()
  @RequirePermission("roles", "create")
  @ApiOperation({ summary: "Create a role" })
  async create(@Body() raw: unknown): Promise<RoleDto> {
    const parsed = roleInputSchema.safeParse(raw);
    if (!parsed.success) throw badRequest(parsed.error.issues);

    return toDto(await this.roles.create(parsed.data));
  }

  @Patch(":id")
  @RequirePermission("roles", "update")
  @ApiOperation({ summary: "Rename a role or change what it grants" })
  async update(@Param("id") id: string, @Body() raw: unknown): Promise<RoleDto> {
    const parsed = roleUpdateSchema.safeParse(raw);
    if (!parsed.success) throw badRequest(parsed.error.issues);

    return toDto(await this.roles.update(id, parsed.data));
  }

  @Delete(":id")
  @RequirePermission("roles", "delete")
  @HttpCode(204)
  @ApiOperation({ summary: "Delete a role — accounts created from it keep their permissions" })
  async remove(@Param("id") id: string): Promise<void> {
    await this.roles.remove(id);
  }
}

function toDto(role: RoleDocument): RoleDto {
  return {
    id: role.id,
    name: role.name,
    slug: role.slug,
    description: role.description,
    permissions: role.permissions,
    isSystem: role.isSystem,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  };
}
