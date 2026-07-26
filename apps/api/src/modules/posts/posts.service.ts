import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types, type QueryFilter } from "mongoose";

import {
  paginate,
  readingMinutes,
  slugify,
  slugSchema,
  type Paginated,
  type Post as PostDto,
  type PostInput,
  type PostQuery,
  type PostSummary,
  type PostUpdate,
} from "@kedland/types";

import { AuditService } from "../audit/audit.service";
import { RevalidateService } from "../revalidate/revalidate.service";

import { Post, type PostDocument } from "./schemas/post.schema";

/** Slugs that collide with the collection's own routes. See `resolveSlug`. */
const RESERVED_SLUGS = new Set(["recent", "slugs"]);

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    @InjectModel(Post.name) private readonly posts: Model<PostDocument>,
    private readonly audit: AuditService,
    private readonly revalidate: RevalidateService,
  ) {}

  /* ── The public site ─────────────────────────────────────────────────── */

  /**
   * Published posts, newest first.
   *
   * The status filter is applied here rather than left to the caller: a public
   * endpoint that could be asked for drafts is one query parameter away from
   * publishing the school's unfinished writing.
   */
  async listPublished(query: PostQuery): Promise<Paginated<PostSummary>> {
    const filter: QueryFilter<PostDocument> = { status: "published" };
    if (query.category) filter.category = query.category;

    return this.paginateSummaries(filter, query);
  }

  /** One published post by slug. A draft is a 404 to the public, not a 403 —
   *  the existence of an unpublished post is not public information. */
  async findPublishedBySlug(slug: string): Promise<PostDto> {
    const post = await this.posts.findOne({ slug, status: "published" }).exec();
    if (!post) throw new NotFoundException(`No such post: ${slug}`);

    return this.toDto(post);
  }

  /**
   * The slugs of every published post, for the sitemap and static generation.
   *
   * Returns the update time too, so `sitemap.xml` can carry `lastmod` without
   * a second query.
   */
  async listPublishedSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
    const found = await this.posts
      .find({ status: "published" }, { slug: 1, updatedAt: 1 })
      .sort({ publishedAt: -1 })
      .exec();

    return found.map((post) => ({
      slug: post.slug,
      updatedAt: post.updatedAt.toISOString(),
    }));
  }

  /** The three most recent published posts, for the home page teaser. */
  async listRecent(limit = 3): Promise<PostSummary[]> {
    const found = await this.posts
      .find({ status: "published" })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .exec();

    return found.map((post) => this.toSummary(post));
  }

  /* ── The dashboard ───────────────────────────────────────────────────── */

  /** Every post, drafts included. */
  async listAll(query: PostQuery): Promise<Paginated<PostSummary>> {
    const filter: QueryFilter<PostDocument> = {};
    if (query.category) filter.category = query.category;
    if (query.status) filter.status = query.status;

    return this.paginateSummaries(filter, query);
  }

  async findById(id: string): Promise<PostDto> {
    return this.toDto(await this.get(id));
  }

  /**
   * Creates a draft.
   *
   * Always a draft, never published: publishing is its own action, so that
   * cache revalidation has exactly one place to hang off and an editor cannot
   * publish by accident.
   */
  async create(input: PostInput, actorId: string): Promise<PostDto> {
    const slug = await this.resolveSlug(input.slug ?? slugify(input.title), null);

    const created = await this.posts.create({
      title: input.title,
      slug,
      category: input.category,
      excerpt: input.excerpt,
      body: input.body,
      coverImage: input.coverImage ?? null,
      status: "draft",
      publishedAt: null,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      authorId: new Types.ObjectId(actorId),
    });

    await this.audit.record({
      actorId,
      action: "create",
      entityType: "post",
      entityId: created.id,
      changes: { title: input.title, slug },
    });

    return this.toDto(created);
  }

  /**
   * Edits a post.
   *
   * A published post being edited revalidates the site: the correction is
   * useless if the cached page keeps serving the mistake.
   */
  async update(id: string, input: PostUpdate, actorId: string): Promise<PostDto> {
    const post = await this.get(id);

    if (input.slug !== undefined || input.title !== undefined) {
      /*
       * A slug follows the title only while two things are true: the post is
       * still a draft, and nobody has chosen its URL by hand.
       *
       * Both conditions are needed, and each guards a different mistake.
       * Status alone silently overwrote a draft URL an editor had deliberately
       * set, the next time they touched the headline. Derivation alone would
       * rename a *published* post's URL when somebody fixed a typo in the
       * headline — and a published URL is a promise, already shared on
       * Instagram and indexed. Comparing the stored slug against what the
       * current title would generate is what tells them apart.
       */
      const wasDerived = post.slug === slugify(post.title);
      const mayFollowTitle = post.status === "draft" && wasDerived;
      const wanted = input.slug ?? (mayFollowTitle ? slugify(input.title ?? post.title) : post.slug);
      post.slug = await this.resolveSlug(wanted, post.id);
    }

    if (input.title !== undefined) post.title = input.title;
    if (input.category !== undefined) post.category = input.category;
    if (input.excerpt !== undefined) post.excerpt = input.excerpt;
    if (input.body !== undefined) post.body = input.body;
    // `null` removes the image; `undefined` leaves it alone. Without the null
    // branch the schema's `CoverImage | null` state is unreachable and a cover
    // photograph can be replaced but never taken down.
    if (input.coverImage !== undefined) post.coverImage = input.coverImage ?? null;
    if (input.seoTitle !== undefined) post.seoTitle = input.seoTitle;
    if (input.seoDescription !== undefined) post.seoDescription = input.seoDescription;

    await post.save();

    await this.audit.record({
      actorId,
      action: "update",
      entityType: "post",
      entityId: post.id,
      changes: input,
    });

    if (post.status === "published") await this.revalidate.post(post.slug);

    return this.toDto(post);
  }

  /**
   * Publishes a post.
   *
   * `publishedAt` is set only the first time. Republishing something that was
   * pulled down does not present it as new.
   */
  async publish(id: string, actorId: string): Promise<PostDto> {
    const post = await this.get(id);

    post.status = "published";
    post.publishedAt ??= new Date();
    await post.save();

    await this.audit.record({
      actorId,
      action: "publish",
      entityType: "post",
      entityId: post.id,
      changes: { slug: post.slug },
    });

    await this.revalidate.post(post.slug);

    return this.toDto(post);
  }

  /** Takes a post down, and clears it from the cache so it actually goes. */
  async unpublish(id: string, actorId: string): Promise<PostDto> {
    const post = await this.get(id);

    post.status = "draft";
    await post.save();

    await this.audit.record({
      actorId,
      action: "unpublish",
      entityType: "post",
      entityId: post.id,
      changes: { slug: post.slug },
    });

    // Without this the page stays served from the cache — "unpublished" in the
    // dashboard and still public to everyone else.
    //
    // `revalidate` swallows its own failures by design, so ask it whether the
    // purge actually happened: for unpublishing specifically, a silent failure
    // means withdrawn content is still readable and nobody knows. Everywhere
    // else staleness is cosmetic; here it is the whole point of the action.
    const purged = await this.revalidate.post(post.slug);
    if (!purged) {
      this.logger.warn(
        `Unpublished ${post.slug} but could not clear the site's cache — it may stay readable for up to an hour`,
      );
    }

    return this.toDto(post);
  }

  async remove(id: string, actorId: string): Promise<void> {
    const post = await this.get(id);
    const { slug, status } = post;

    await post.deleteOne();
    await this.audit.record({ actorId, action: "delete", entityType: "post", entityId: id });

    if (status === "published") await this.revalidate.post(slug);
  }

  /* ── Internals ───────────────────────────────────────────────────────── */

  /**
   * Checks a slug is usable, and says so plainly if it is not.
   *
   * Returning a 409 rather than quietly appending `-2`: the editor chose that
   * URL, and a silently different one is worse than being told.
   */
  private async resolveSlug(wanted: string, exceptId: string | null): Promise<string> {
    /*
     * `GET /posts/:slug` shares its path with `GET /posts/recent` and
     * `GET /posts/slugs`, and Nest matches the literal routes first. A post
     * slugged "recent" would therefore be unreachable — worse, the site's
     * `getPost("recent")` would receive an *array* where it expects a post and
     * crash the static build. Refused at the point the slug is chosen, where
     * the editor can still do something about it.
     */
    if (RESERVED_SLUGS.has(wanted)) {
      throw new ConflictException(`"${wanted}" is reserved. Please choose a different URL.`);
    }

    const parsed = slugSchema.safeParse(wanted);
    if (!parsed.success) {
      throw new BadRequestException(
        wanted
          ? `"${wanted}" is not a usable URL. Use lower-case words separated by single dashes.`
          : "This title has no letters or numbers in it, so it cannot become a URL. Please set a slug.",
      );
    }

    const clash = await this.posts.findOne({ slug: parsed.data }, { _id: 1 }).exec();
    if (clash && clash.id !== exceptId) {
      throw new ConflictException(`Another post already uses the URL "${parsed.data}"`);
    }

    return parsed.data;
  }

  private async paginateSummaries(
    filter: QueryFilter<PostDocument>,
    query: PostQuery,
  ): Promise<Paginated<PostSummary>> {
    const [found, total] = await Promise.all([
      this.posts
        .find(filter)
        // Drafts have no publication date, so fall back to creation order for
        // them; without the tiebreak the dashboard's list is arbitrary.
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .exec(),
      this.posts.countDocuments(filter).exec(),
    ]);

    return paginate(
      found.map((post) => this.toSummary(post)),
      total,
      query.page,
      query.pageSize,
    );
  }

  private async get(id: string): Promise<PostDocument> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException("No such post");

    const post = await this.posts.findById(id).exec();
    if (!post) throw new NotFoundException("No such post");

    return post;
  }

  private toSummary(document: PostDocument): PostSummary {
    const { body: _body, ...summary } = this.toDto(document);
    return summary;
  }

  private toDto(document: PostDocument): PostDto {
    return {
      id: document.id,
      title: document.title,
      slug: document.slug,
      category: document.category,
      excerpt: document.excerpt,
      body: document.body,
      coverImage: document.coverImage
        ? { mediaId: document.coverImage.mediaId, alt: document.coverImage.alt }
        : null,
      status: document.status,
      publishedAt: document.publishedAt?.toISOString() ?? null,
      seoTitle: document.seoTitle,
      seoDescription: document.seoDescription,
      readingMinutes: readingMinutes(document.body),
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
      authorId: document.authorId?.toHexString() ?? null,
    };
  }
}
