import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { Types } from "mongoose";

import { AuditService } from "../audit/audit.service";
import { RevalidateService } from "../revalidate/revalidate.service";

import { PostsService } from "./posts.service";
import { Post } from "./schemas/post.schema";

interface Chain {
  exec: jest.Mock;
  sort: jest.Mock;
  skip: jest.Mock;
  limit: jest.Mock;
}

/** A chainable query whose every link returns itself. */
function query<T>(result: T): Chain {
  const chain = {
    exec: jest.fn().mockResolvedValue(result),
    sort: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
  };
  chain.sort.mockReturnValue(chain);
  chain.skip.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  return chain;
}

const ACTOR = new Types.ObjectId().toHexString();
const ID = new Types.ObjectId().toHexString();

const INPUT = {
  title: "Our first sports day",
  category: "events" as const,
  excerpt: "A morning of races.",
  body: "word ".repeat(400),
};

function storedPost(overrides: Record<string, unknown> = {}) {
  return {
    id: ID,
    title: INPUT.title,
    slug: "our-first-sports-day",
    category: "events",
    excerpt: INPUT.excerpt,
    body: INPUT.body,
    coverImage: null,
    status: "draft",
    publishedAt: null as Date | null,
    seoTitle: null,
    seoDescription: null,
    authorId: null as Types.ObjectId | null,
    createdAt: new Date("2026-03-01T09:00:00Z"),
    updatedAt: new Date("2026-03-02T09:00:00Z"),
    save: jest.fn().mockResolvedValue(undefined),
    deleteOne: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("PostsService", () => {
  let service: PostsService;
  let model: {
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    findById: jest.Mock;
    countDocuments: jest.Mock;
  };
  let audit: { record: jest.Mock };
  let revalidate: { post: jest.Mock };

  beforeEach(async () => {
    model = {
      create: jest.fn((doc: Record<string, unknown>) => Promise.resolve(storedPost(doc))),
      find: jest.fn().mockReturnValue(query([])),
      findOne: jest.fn().mockReturnValue(query(null)),
      findById: jest.fn().mockReturnValue(query(null)),
      countDocuments: jest.fn().mockReturnValue(query(0)),
    };
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    revalidate = { post: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getModelToken(Post.name), useValue: model },
        { provide: AuditService, useValue: audit },
        { provide: RevalidateService, useValue: revalidate },
      ],
    }).compile();

    service = moduleRef.get(PostsService);
  });

  describe("the public list", () => {
    /**
     * The whole reason `listPublished` filters rather than trusting a caller.
     * A public endpoint that can be asked for drafts is one query parameter
     * away from publishing the school's unfinished writing.
     */
    it("only ever asks for published posts", async () => {
      await service.listPublished({ page: 1, pageSize: 9 });

      expect(model.find).toHaveBeenCalledWith(expect.objectContaining({ status: "published" }));
    });

    it("cannot be talked into returning drafts", async () => {
      // `status` is in the query schema for the dashboard's benefit; the public
      // path must ignore it entirely.
      await service.listPublished({ page: 1, pageSize: 9, status: "draft" });

      expect(model.find).toHaveBeenCalledWith(expect.objectContaining({ status: "published" }));
    });

    it("narrows by category when asked", async () => {
      await service.listPublished({ page: 1, pageSize: 9, category: "news" });

      expect(model.find).toHaveBeenCalledWith({ status: "published", category: "news" });
    });

    it("reports a draft's slug as missing rather than forbidden", async () => {
      // A 403 would confirm the post exists. Whether the school is drafting
      // something is not public information.
      await expect(service.findPublishedBySlug("a-draft")).rejects.toThrow(NotFoundException);
      expect(model.findOne).toHaveBeenCalledWith({ slug: "a-draft", status: "published" });
    });

    it("paginates from one, not zero", async () => {
      const chain = query([]);
      model.find.mockReturnValue(chain);

      await service.listPublished({ page: 3, pageSize: 9 });

      expect(chain.skip).toHaveBeenCalledWith(18);
    });

    it("leaves the body out of a listing", async () => {
      model.find.mockReturnValue(query([storedPost({ status: "published" })]));

      const { items } = await service.listPublished({ page: 1, pageSize: 9 });

      expect(items[0]).not.toHaveProperty("body");
      expect(items[0]).toHaveProperty("excerpt");
    });
  });

  describe("reserved slugs", () => {
    /**
     * `/posts/recent` and `/posts/slugs` are literal routes on the same path as
     * `/posts/:slug`, and Nest matches literals first. A post slugged "recent"
     * would be unreachable, and the site's `getPost("recent")` would receive an
     * array where it expects a post — crashing the static build.
     */
    it.each(["recent", "slugs"])("refuses a post slugged %s", async (slug) => {
      await expect(service.create({ ...INPUT, slug }, ACTOR)).rejects.toThrow(ConflictException);
    });
  });

  describe("create", () => {
    it("derives a slug from the title", async () => {
      await service.create(INPUT, ACTOR);

      expect(model.create).toHaveBeenCalledWith(expect.objectContaining({ slug: "our-first-sports-day" }));
    });

    it("prefers a slug the editor chose", async () => {
      await service.create({ ...INPUT, slug: "sports-day-2026" }, ACTOR);

      expect(model.create).toHaveBeenCalledWith(expect.objectContaining({ slug: "sports-day-2026" }));
    });

    /**
     * Publishing is a separate action so that revalidation has one place to
     * hang off and nobody publishes by accident.
     */
    it("always lands as a draft", async () => {
      await service.create(INPUT, ACTOR);

      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: "draft", publishedAt: null }),
      );
    });

    it("does not revalidate anything — there is nothing public yet", async () => {
      await service.create(INPUT, ACTOR);
      expect(revalidate.post).not.toHaveBeenCalled();
    });

    it("refuses a slug another post already uses", async () => {
      model.findOne.mockReturnValue(query({ id: "someone-else" }));

      // Silently appending "-2" would give the editor a URL they did not
      // choose and never told them.
      await expect(service.create(INPUT, ACTOR)).rejects.toThrow(ConflictException);
    });

    it("explains itself when a title cannot become a URL", async () => {
      await expect(service.create({ ...INPUT, title: "!!!" }, ACTOR)).rejects.toThrow(BadRequestException);
    });

    it("records who wrote it", async () => {
      await service.create(INPUT, ACTOR);

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: "create", entityType: "post" }),
      );
    });

    it("computes the reading time from the body", async () => {
      const created = await service.create(INPUT, ACTOR);
      expect(created.readingMinutes).toBe(2);
    });
  });

  describe("update", () => {
    it("applies only the fields it was given", async () => {
      const post = storedPost();
      model.findById.mockReturnValue(query(post));

      await service.update(ID, { excerpt: "A new summary." }, ACTOR);

      expect(post.excerpt).toBe("A new summary.");
      expect(post.title).toBe(INPUT.title);
    });

    /**
     * A published URL is a promise. Renaming a headline to fix a typo must not
     * silently break every link the school has already shared.
     */
    it("keeps a published post's URL when the title changes", async () => {
      const post = storedPost({ status: "published", slug: "our-first-sports-day" });
      model.findById.mockReturnValue(query(post));

      await service.update(ID, { title: "Our first sports day — what a morning" }, ACTOR);

      expect(post.slug).toBe("our-first-sports-day");
    });

    it("does re-derive a draft's URL from its new title", async () => {
      const post = storedPost({ status: "draft" });
      model.findById.mockReturnValue(query(post));

      await service.update(ID, { title: "Sports day 2026" }, ACTOR);

      expect(post.slug).toBe("sports-day-2026");
    });

    /**
     * The regression a review caught: keying only off `status` meant a draft
     * URL an editor had deliberately chosen was silently overwritten the next
     * time they touched the headline.
     */
    it("keeps a draft's hand-chosen URL when the title changes", async () => {
      // Slug does not match what the title would generate, so it was chosen.
      const post = storedPost({ status: "draft", slug: "sports-day-2026" });
      model.findById.mockReturnValue(query(post));

      await service.update(ID, { title: "Our first sports day was a joy" }, ACTOR);

      expect(post.slug).toBe("sports-day-2026");
    });

    it("still lets an editor set the URL by hand on a published post", async () => {
      const post = storedPost({ status: "published" });
      model.findById.mockReturnValue(query(post));

      await service.update(ID, { slug: "sports-day" }, ACTOR);

      expect(post.slug).toBe("sports-day");
    });

    it("does not treat the post's own slug as a clash", async () => {
      const post = storedPost({ status: "published" });
      model.findById.mockReturnValue(query(post));
      model.findOne.mockReturnValue(query({ id: ID }));

      await expect(service.update(ID, { slug: "our-first-sports-day" }, ACTOR)).resolves.toBeDefined();
    });

    /** A correction is useless if the cache keeps serving the mistake. */
    it("refreshes the site when the post is live", async () => {
      model.findById.mockReturnValue(query(storedPost({ status: "published" })));

      await service.update(ID, { excerpt: "Fixed." }, ACTOR);

      expect(revalidate.post).toHaveBeenCalledWith("our-first-sports-day");
    });

    it("does not refresh anything for a draft", async () => {
      model.findById.mockReturnValue(query(storedPost({ status: "draft" })));

      await service.update(ID, { excerpt: "Still working on it." }, ACTOR);

      expect(revalidate.post).not.toHaveBeenCalled();
    });
  });

  describe("publish", () => {
    it("makes the post public and refreshes the site", async () => {
      const post = storedPost();
      model.findById.mockReturnValue(query(post));

      await service.publish(ID, ACTOR);

      expect(post.status).toBe("published");
      expect(post.publishedAt).toBeInstanceOf(Date);
      expect(revalidate.post).toHaveBeenCalledWith("our-first-sports-day");
    });

    /**
     * Republishing something that was pulled down is not a new announcement.
     * Re-dating it would reshuffle the news list for no reason.
     */
    it("keeps the original date when republishing", async () => {
      const first = new Date("2026-01-15T10:00:00Z");
      const post = storedPost({ status: "draft", publishedAt: first });
      model.findById.mockReturnValue(query(post));

      await service.publish(ID, ACTOR);

      expect(post.publishedAt).toBe(first);
    });

    it("records the verb, not just an update", async () => {
      model.findById.mockReturnValue(query(storedPost()));

      await service.publish(ID, ACTOR);

      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: "publish" }));
    });
  });

  describe("unpublish", () => {
    /**
     * The failure this guards against: "unpublished" in the dashboard and
     * still visible to everyone else, because the cached page was never
     * cleared.
     */
    it("clears the post from the site's cache", async () => {
      model.findById.mockReturnValue(query(storedPost({ status: "published" })));

      await service.unpublish(ID, ACTOR);

      expect(revalidate.post).toHaveBeenCalledWith("our-first-sports-day");
    });

    it("keeps the publication date, so republishing is not a new story", async () => {
      const first = new Date("2026-01-15T10:00:00Z");
      const post = storedPost({ status: "published", publishedAt: first });
      model.findById.mockReturnValue(query(post));

      await service.unpublish(ID, ACTOR);

      expect(post.status).toBe("draft");
      expect(post.publishedAt).toBe(first);
    });
  });

  describe("remove", () => {
    it("refreshes the site when the deleted post was live", async () => {
      model.findById.mockReturnValue(query(storedPost({ status: "published" })));

      await service.remove(ID, ACTOR);

      expect(revalidate.post).toHaveBeenCalledWith("our-first-sports-day");
    });

    it("does not bother when it was only a draft", async () => {
      model.findById.mockReturnValue(query(storedPost({ status: "draft" })));

      await service.remove(ID, ACTOR);

      expect(revalidate.post).not.toHaveBeenCalled();
    });

    it("reads the slug before deleting, not after", async () => {
      // Reading `post.slug` off a deleted document is the kind of thing that
      // works until Mongoose changes what a removed document looks like.
      const post = storedPost({ status: "published" });
      post.deleteOne = jest.fn().mockImplementation(() => {
        post.slug = "";
        return Promise.resolve(undefined);
      });
      model.findById.mockReturnValue(query(post));

      await service.remove(ID, ACTOR);

      expect(revalidate.post).toHaveBeenCalledWith("our-first-sports-day");
    });

    it("rejects an id that is not an ObjectId without querying", async () => {
      await expect(service.remove("nonsense", ACTOR)).rejects.toThrow(NotFoundException);
      expect(model.findById).not.toHaveBeenCalled();
    });
  });

  describe("listPublishedSlugs", () => {
    it("returns each slug with its update time, for the sitemap", async () => {
      model.find.mockReturnValue(query([storedPost({ status: "published" })]));

      const slugs = await service.listPublishedSlugs();

      expect(slugs).toEqual([{ slug: "our-first-sports-day", updatedAt: "2026-03-02T09:00:00.000Z" }]);
    });
  });

  describe("listRecent", () => {
    it("asks for only a few, newest first", async () => {
      const chain = query([]);
      model.find.mockReturnValue(chain);

      await service.listRecent();

      expect(model.find).toHaveBeenCalledWith({ status: "published" });
      expect(chain.limit).toHaveBeenCalledWith(3);
      expect(chain.sort).toHaveBeenCalledWith({ publishedAt: -1 });
    });
  });
});
