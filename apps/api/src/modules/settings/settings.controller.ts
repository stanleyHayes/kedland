import { Body, Controller, Get, Patch } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { siteSettingsSchema, type SiteSettings } from "@kedland/types";

import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { badRequest } from "../../common/http/bad-request";

import { SettingsService } from "./settings.service";

@ApiTags("settings")
@Public()
@Controller("settings")
export class PublicSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get("public")
  async get(): Promise<SiteSettings> {
    return this.settings.get();
  }
}

@ApiTags("settings")
@Controller("admin/settings")
export class AdminSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  @RequirePermission("settings", "read")
  async get(): Promise<SiteSettings> {
    return this.settings.get();
  }

  @Patch()
  @RequirePermission("settings", "update")
  async update(@Body() raw: unknown, @CurrentUser() user: AuthenticatedUser): Promise<SiteSettings> {
    const parsed = siteSettingsSchema.safeParse(raw);
    if (!parsed.success) throw badRequest(parsed.error.issues);
    return this.settings.update(parsed.data, user.id);
  }
}
