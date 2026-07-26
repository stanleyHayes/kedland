import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post as HttpPost,
  Query,
} from "@nestjs/common";
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";

import {
  postInputSchema,
  postQuerySchema,
  postUpdateSchema,
  type Paginated,
  type Post,
  type PostSummary,
} from "@kedland/types";

import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { badRequest } from "../../common/http/bad-request";

import { CreatePostDto, UpdatePostDto } from "./dto/post.dto";
import { PostsService } from "./posts.service";

/**
 * Posts, for the public site.
 *
 * Every route here serves published posts only, and that is enforced in the
 * service rather than by a query parameter — a public endpoint that can be
 * asked for drafts is one request away from publishing unfinished writing.
 */
@ApiTags("posts")
@Public()
@Controller("posts")
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  @Get()
  @ApiQuery({ name: "q", required: false })
  @ApiQuery({ name: "category", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiOperation({ summary: "Published posts, newest first" })
  async list(@Query() query: Record<string, string>): Promise<Paginated<PostSummary>> {
    const parsed = postQuerySchema.safeParse(query);
    if (!parsed.success) throw badRequest(parsed.error.issues);

    return this.posts.listPublished(parsed.data);
  }

  /**
   * Sits above `:slug` deliberately — Nest matches in declaration order, so a
   * parameterised route declared first would swallow this one.
   */
  @Get("recent")
  @ApiOperation({ summary: "The latest few posts, for the home page" })
  async recent(): Promise<PostSummary[]> {
    return this.posts.listRecent();
  }

  @Get("slugs")
  @ApiOperation({ summary: "Every published slug, for the sitemap" })
  async slugs(): Promise<{ slug: string; updatedAt: string }[]> {
    return this.posts.listPublishedSlugs();
  }

  @Get(":slug")
  @ApiOperation({ summary: "One published post" })
  async findOne(@Param("slug") slug: string): Promise<Post> {
    return this.posts.findPublishedBySlug(slug);
  }
}

/**
 * Posts, for the dashboard.
 *
 * Publishing and unpublishing are their own routes rather than a field on the
 * update: they are the only actions that change what the public can see, and
 * keeping them separate gives cache revalidation one place to live and the
 * audit trail a verb worth reading.
 */
@ApiTags("posts")
@Controller("admin/posts")
export class AdminPostsController {
  constructor(private readonly posts: PostsService) {}

  @Get()
  @RequirePermission("posts", "read")
  @ApiQuery({ name: "q", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "category", required: false })
  @ApiOperation({ summary: "Every post, drafts included" })
  async list(@Query() query: Record<string, string>): Promise<Paginated<PostSummary>> {
    const parsed = postQuerySchema.safeParse(query);
    if (!parsed.success) throw badRequest(parsed.error.issues);

    return this.posts.listAll(parsed.data);
  }

  @Get(":id")
  @RequirePermission("posts", "read")
  @ApiOperation({ summary: "One post, by id" })
  async findOne(@Param("id") id: string): Promise<Post> {
    return this.posts.findById(id);
  }

  @HttpPost()
  @RequirePermission("posts", "create")
  @ApiBody({ type: CreatePostDto })
  @ApiOperation({ summary: "Create a draft" })
  async create(@Body() raw: unknown, @CurrentUser() user: AuthenticatedUser): Promise<Post> {
    const parsed = postInputSchema.safeParse(raw);
    if (!parsed.success) throw badRequest(parsed.error.issues);

    return this.posts.create(parsed.data, user.id);
  }

  @Patch(":id")
  @RequirePermission("posts", "update")
  @ApiBody({ type: UpdatePostDto })
  @ApiOperation({ summary: "Edit a post" })
  async update(
    @Param("id") id: string,
    @Body() raw: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Post> {
    const parsed = postUpdateSchema.safeParse(raw);
    if (!parsed.success) throw badRequest(parsed.error.issues);

    return this.posts.update(id, parsed.data, user.id);
  }

  @HttpPost(":id/publish")
  @RequirePermission("posts", "update")
  @ApiOperation({ summary: "Publish a post and refresh the site" })
  async publish(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser): Promise<Post> {
    return this.posts.publish(id, user.id);
  }

  @HttpPost(":id/unpublish")
  @RequirePermission("posts", "update")
  @ApiOperation({ summary: "Take a post down and clear it from the cache" })
  async unpublish(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser): Promise<Post> {
    return this.posts.unpublish(id, user.id);
  }

  /** Deleting needs its own permission; an editor without it unpublishes instead. */
  @Delete(":id")
  @RequirePermission("posts", "delete")
  @HttpCode(204)
  @ApiOperation({ summary: "Delete a post" })
  async remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.posts.remove(id, user.id);
  }
}
