import { BadRequestException } from "@nestjs/common";
import { Test } from "@nestjs/testing";

import { ALL_PERMISSIONS, type Permission } from "@kedland/types";

import { AdminPostsController, PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";

import type { AuthenticatedUser } from "../../common/decorators/current-user.decorator";

const USER: AuthenticatedUser = {
  id: "507f1f77bcf86cd799439011",
  email: "a@b.c",
  roleSlug: "administrator",
  permissions: ALL_PERMISSIONS as Permission[],
};

const VALID = {
  title: "Our first sports day",
  category: "events",
  excerpt: "A morning of races.",
  body: "It was wonderful.",
};

const EMPTY_LIST = { items: [], total: 0, page: 1, pageSize: 9, totalPages: 0 };

function serviceDouble() {
  return {
    listPublished: jest.fn().mockResolvedValue(EMPTY_LIST),
    listAll: jest.fn().mockResolvedValue(EMPTY_LIST),
    findPublishedBySlug: jest.fn().mockResolvedValue({ slug: "a-post" }),
    findById: jest.fn().mockResolvedValue({ id: "1" }),
    listRecent: jest.fn().mockResolvedValue([]),
    listPublishedSlugs: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: "1" }),
    update: jest.fn().mockResolvedValue({ id: "1" }),
    publish: jest.fn().mockResolvedValue({ id: "1", status: "published" }),
    unpublish: jest.fn().mockResolvedValue({ id: "1", status: "draft" }),
    remove: jest.fn().mockResolvedValue(undefined),
  };
}

describe("PostsController", () => {
  let controller: PostsController;
  let posts: ReturnType<typeof serviceDouble>;

  beforeEach(async () => {
    posts = serviceDouble();

    const moduleRef = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [{ provide: PostsService, useValue: posts }],
    }).compile();

    controller = moduleRef.get(PostsController);
  });

  it("coerces the query string's page number", async () => {
    // Query parameters arrive as strings; a page of "2" must not become NaN and
    // skip a negative number of documents.
    await controller.list({ page: "2" });

    expect(posts.listPublished).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
  });

  it("defaults to the first page", async () => {
    await controller.list({});
    expect(posts.listPublished).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
  });

  it("refuses a page size that would ask for everything", async () => {
    await expect(controller.list({ pageSize: "5000" })).rejects.toThrow(BadRequestException);
  });

  it("refuses a category outside the fixed set", async () => {
    await expect(controller.list({ category: "gossip" })).rejects.toThrow(BadRequestException);
  });

  it("serves one published post by slug", async () => {
    await controller.findOne("a-post");
    expect(posts.findPublishedBySlug).toHaveBeenCalledWith("a-post");
  });

  it("exposes the recent list for the home page", async () => {
    await controller.recent();
    expect(posts.listRecent).toHaveBeenCalled();
  });

  it("exposes the slugs for the sitemap", async () => {
    await controller.slugs();
    expect(posts.listPublishedSlugs).toHaveBeenCalled();
  });
});

describe("AdminPostsController", () => {
  let controller: AdminPostsController;
  let posts: ReturnType<typeof serviceDouble>;

  beforeEach(async () => {
    posts = serviceDouble();

    const moduleRef = await Test.createTestingModule({
      controllers: [AdminPostsController],
      providers: [{ provide: PostsService, useValue: posts }],
    }).compile();

    controller = moduleRef.get(AdminPostsController);
  });

  describe("create", () => {
    it("accepts a valid post and records the author", async () => {
      await controller.create(VALID, USER);
      expect(posts.create).toHaveBeenCalledWith(expect.objectContaining(VALID), USER.id);
    });

    it("rejects a body the shared schema refuses", async () => {
      await expect(controller.create({ ...VALID, title: "" }, USER)).rejects.toThrow(BadRequestException);
      expect(posts.create).not.toHaveBeenCalled();
    });

    it("names the field that was wrong, so the editor's form can point at it", async () => {
      const thrown = await controller
        .create({ ...VALID, excerpt: "" }, USER)
        .then(() => undefined)
        .catch((error: unknown) => error as BadRequestException);

      const response = thrown?.getResponse() as { errors: Record<string, string[]> };
      expect(Object.keys(response.errors)).toContain("excerpt");
    });

    /**
     * Publishing is its own route. If `status` were accepted here, an editor
     * could publish by typo and there would be no single place to hang the
     * cache revalidation that publishing has to trigger.
     */
    it("refuses an attempt to publish through create", async () => {
      await expect(controller.create({ ...VALID, status: "published" }, USER)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("update", () => {
    it("accepts a single field", async () => {
      await controller.update("1", { excerpt: "A new summary." }, USER);
      expect(posts.update).toHaveBeenCalledWith("1", { excerpt: "A new summary." }, USER.id);
    });

    it("still validates what it is given", async () => {
      await expect(controller.update("1", { slug: "Not A Slug" }, USER)).rejects.toThrow(BadRequestException);
    });

    it("refuses an attempt to publish through update", async () => {
      await expect(controller.update("1", { status: "published" }, USER)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  it("publishes through its own route", async () => {
    await controller.publish("1", USER);
    expect(posts.publish).toHaveBeenCalledWith("1", USER.id);
  });

  it("unpublishes through its own route", async () => {
    await controller.unpublish("1", USER);
    expect(posts.unpublish).toHaveBeenCalledWith("1", USER.id);
  });

  it("lists drafts as well as published posts", async () => {
    await controller.list({ status: "draft" });
    expect(posts.listAll).toHaveBeenCalledWith(expect.objectContaining({ status: "draft" }));
  });

  it("refuses a status outside the vocabulary", async () => {
    await expect(controller.list({ status: "nonsense" })).rejects.toThrow(BadRequestException);
  });

  it("deletes", async () => {
    await controller.remove("1", USER);
    expect(posts.remove).toHaveBeenCalledWith("1", USER.id);
  });
});
