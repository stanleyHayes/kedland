import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { faqInputSchema, faqUpdateSchema, type Faq } from "@kedland/types";

import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { badRequest } from "../../common/http/bad-request";

import { FaqsService } from "./faqs.service";

@ApiTags("faqs")
@Public()
@Controller("faqs")
export class PublicFaqsController {
  constructor(private readonly faqs: FaqsService) {}

  @Get()
  async list(): Promise<Faq[]> {
    return this.faqs.list(false);
  }
}

@ApiTags("faqs")
@Controller("admin/faqs")
export class AdminFaqsController {
  constructor(private readonly faqs: FaqsService) {}

  @Get()
  @RequirePermission("faqs", "read")
  async list(): Promise<Faq[]> {
    return this.faqs.list();
  }

  @Post()
  @RequirePermission("faqs", "create")
  async create(@Body() raw: unknown, @CurrentUser() user: AuthenticatedUser): Promise<Faq> {
    const parsed = faqInputSchema.safeParse(raw);
    if (!parsed.success) throw badRequest(parsed.error.issues);
    return this.faqs.create(parsed.data, user.id);
  }

  @Patch(":id")
  @RequirePermission("faqs", "update")
  async update(
    @Param("id") id: string,
    @Body() raw: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Faq> {
    const parsed = faqUpdateSchema.safeParse(raw);
    if (!parsed.success) throw badRequest(parsed.error.issues);
    return this.faqs.update(id, parsed.data, user.id);
  }

  @Delete(":id")
  @RequirePermission("faqs", "delete")
  @HttpCode(204)
  @ApiOperation({ summary: "Delete an FAQ" })
  async remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.faqs.remove(id, user.id);
  }
}
