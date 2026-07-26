import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { instagramTileInputSchema, instagramTileUpdateSchema, type InstagramTile } from "@kedland/types";

import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { badRequest } from "../../common/http/bad-request";

import { InstagramService } from "./instagram.service";

@ApiTags("instagram")
@Public()
@Controller("instagram")
export class PublicInstagramController {
  constructor(private readonly instagram: InstagramService) {}

  @Get()
  async list(): Promise<InstagramTile[]> {
    return this.instagram.list(false);
  }
}

@ApiTags("instagram")
@Controller("admin/instagram")
export class AdminInstagramController {
  constructor(private readonly instagram: InstagramService) {}

  @Get()
  @RequirePermission("gallery", "read")
  async list(): Promise<InstagramTile[]> {
    return this.instagram.list();
  }

  @Post()
  @RequirePermission("gallery", "create")
  async create(@Body() raw: unknown, @CurrentUser() user: AuthenticatedUser): Promise<InstagramTile> {
    const parsed = instagramTileInputSchema.safeParse(raw);
    if (!parsed.success) throw badRequest(parsed.error.issues);
    return this.instagram.create(parsed.data, user.id);
  }

  @Patch(":id")
  @RequirePermission("gallery", "update")
  async update(
    @Param("id") id: string,
    @Body() raw: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<InstagramTile> {
    const parsed = instagramTileUpdateSchema.safeParse(raw);
    if (!parsed.success) throw badRequest(parsed.error.issues);
    return this.instagram.update(id, parsed.data, user.id);
  }

  @Delete(":id")
  @RequirePermission("gallery", "delete")
  @HttpCode(204)
  async remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.instagram.remove(id, user.id);
  }
}
