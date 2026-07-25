import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";

import { pageKeySchema, type PageKey } from "@kedland/types";

import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";

import { ContentService, type PublicSection } from "./content.service";
import { RestoreSectionDto, UpdateSectionDto } from "./dto/content.dto";

/**
 * Narrows a request parameter to a registered page key.
 *
 * The service would reject an unknown page anyway; doing it here keeps the type
 * honest rather than casting a string into a union and hoping.
 */
function parsePageKey(value: string | undefined): PageKey {
  const parsed = pageKeySchema.safeParse(value ?? "");
  if (!parsed.success) throw new NotFoundException(`No such page: ${value ?? "(none given)"}`);
  return parsed.data;
}

/**
 * Page content, for the public site.
 *
 * The page key is a query parameter rather than a path segment because keys
 * contain slashes (`about/our-story`). Putting them in the path would need
 * either a wildcard route or percent-encoded slashes, and proxies handle the
 * latter inconsistently.
 */
@ApiTags("content")
@Public()
@Controller("content")
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get()
  @ApiQuery({ name: "page", example: "about/our-story" })
  @ApiOperation({ summary: "The sections of a page, in registry order" })
  async getPage(@Query("page") page?: string): Promise<PublicSection[]> {
    return this.content.getPage(parsePageKey(page));
  }
}

/**
 * The dashboard's side.
 *
 * No create and no delete: sections come into existence through the registry
 * and the seed, never through a request. An editor changes values.
 */
@ApiTags("content")
@Controller("admin/content")
export class AdminContentController {
  constructor(private readonly content: ContentService) {}

  @Get()
  @ApiOperation({ summary: "Every page and how many sections it carries" })
  async list(): Promise<{ page: PageKey; label: string; sectionCount: number }[]> {
    return this.content.listPages();
  }

  @Patch("sections/:key")
  @ApiQuery({ name: "page", example: "home" })
  @ApiOperation({ summary: "Update one section's values" })
  async update(
    @Param("key") key: string,
    @Body() dto: UpdateSectionDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query("page") page?: string,
  ): Promise<PublicSection> {
    const updated = await this.content.updateSection(parsePageKey(page), key, dto.data, user.id);
    return { key: updated.key, type: "", order: updated.order, data: updated.data };
  }

  @Post("sections/:key/restore")
  @ApiQuery({ name: "page", example: "home" })
  @ApiOperation({ summary: "Restore a previous version of a section" })
  async restore(
    @Param("key") key: string,
    @Body() dto: RestoreSectionDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query("page") page?: string,
  ): Promise<PublicSection> {
    const restored = await this.content.restoreSection(parsePageKey(page), key, dto.version, user.id);
    return { key: restored.key, type: "", order: restored.order, data: restored.data };
  }
}
