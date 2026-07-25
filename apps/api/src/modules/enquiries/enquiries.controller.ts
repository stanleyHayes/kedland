import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Ip,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";

import { enquirySchema, enquiryStatusSchema, type Enquiry } from "@kedland/types";

import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";

import { SubmitEnquiryDto, UpdateEnquiryStatusDto } from "./dto/enquiry.dto";
import { EnquiriesService } from "./enquiries.service";
import { TurnstileService } from "./turnstile.service";

/**
 * The public enquiry endpoint.
 *
 * Rate limited hard: this is the one unauthenticated write on the whole API,
 * and a school's contact form is exactly the shape of thing that attracts
 * automated submissions. Five a minute per IP is generous for a parent and
 * useless for a bot.
 */
@ApiTags("enquiries")
@Public()
@Controller("enquiries")
export class EnquiriesController {
  constructor(
    private readonly enquiries: EnquiriesService,
    private readonly turnstile: TurnstileService,
  ) {}

  @Post()
  @HttpCode(202)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiBody({ type: SubmitEnquiryDto })
  @ApiOperation({ summary: "Send the school an enquiry" })
  async submit(
    // `SubmitEnquiryDto` documents the shape for Swagger; `enquirySchema` is
    // what enforces it, because that is the same schema the public site
    // validates against — one contract, not two that can drift.
    @Body() raw: unknown,
    @Ip() ip: string,
  ): Promise<{ id: string; notified: boolean }> {
    const parsed = enquirySchema.safeParse(raw);
    if (!parsed.success) {
      // Field-keyed, so the form can attach each message to the input it
      // belongs to rather than showing one generic banner. The exceptions
      // filter passes an `errors` map straight through to ProblemDetails.
      const errors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path.join(".") || "_";
        const existing = errors[field] ?? [];
        existing.push(issue.message);
        errors[field] = existing;
      }

      throw new BadRequestException({ errors });
    }

    const human = await this.turnstile.verify(parsed.data.turnstileToken, ip);
    if (!human) {
      throw new BadRequestException("We could not verify that you are human. Please try again.");
    }

    return this.enquiries.submit(parsed.data);
  }
}

/**
 * The office's side.
 *
 * No create: an enquiry only ever comes from a parent. Deleting is restricted
 * to an administrator and exists for a data-protection request, not for
 * tidying an inbox — that is what `archived` is for.
 */
@ApiTags("enquiries")
@Controller("admin/enquiries")
export class AdminEnquiriesController {
  constructor(private readonly enquiries: EnquiriesService) {}

  @Get()
  @ApiQuery({ name: "status", required: false, enum: enquiryStatusSchema.options })
  @ApiOperation({ summary: "Enquiries, newest first" })
  async list(@Query("status") status?: string): Promise<Enquiry[]> {
    if (status === undefined) return this.enquiries.list();

    const parsed = enquiryStatusSchema.safeParse(status);
    if (!parsed.success) throw new BadRequestException(`No such status: ${status}`);

    return this.enquiries.list(parsed.data);
  }

  @Get("counts")
  @ApiOperation({ summary: "How many are unread, and how many were never delivered" })
  async counts(): Promise<{ unread: number; undelivered: number }> {
    return this.enquiries.counts();
  }

  @Get(":id")
  @ApiOperation({ summary: "One enquiry" })
  async findOne(@Param("id") id: string): Promise<Enquiry> {
    return this.enquiries.findOne(id);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Move an enquiry through triage" })
  async setStatus(
    @Param("id") id: string,
    @Body() dto: UpdateEnquiryStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Enquiry> {
    return this.enquiries.setStatus(id, dto.status, user.id);
  }

  @Delete(":id")
  @Roles("admin")
  @HttpCode(204)
  @ApiOperation({ summary: "Erase an enquiry — for a data-protection request" })
  async remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.enquiries.remove(id, user.id, user.role);
  }
}
