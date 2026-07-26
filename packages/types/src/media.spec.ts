import { describe, expect, it } from "vitest";

import { cloudinaryUrl, mediaRegisterSchema, uploadRequestSchema, uploadResultSchema } from "./media";

describe("uploadRequestSchema", () => {
  it("allows a nested folder", () => {
    expect(uploadRequestSchema.safeParse({ folder: "posts/sports-day" }).success).toBe(true);
  });

  it("treats the folder as optional", () => {
    expect(uploadRequestSchema.safeParse({}).success).toBe(true);
  });

  /**
   * The folder is the only thing the browser gets to choose about where a file
   * lands. A traversal here would let a signature request write outside the
   * school's root in a shared Cloudinary account.
   */
  it.each(["../escape", "posts/../../etc", "/absolute", "Posts", "with space", "trailing/"])(
    "rejects %s",
    (folder) => {
      expect(uploadRequestSchema.safeParse({ folder }).success).toBe(false);
    },
  );
});

describe("uploadResultSchema", () => {
  const result = {
    public_id: "kedland/posts/abc",
    secure_url: "https://res.cloudinary.com/kedland/image/upload/v1/kedland/posts/abc.jpg",
    width: 1600,
    height: 1200,
    format: "jpg",
    bytes: 240_000,
  };

  it("accepts what Cloudinary returns", () => {
    expect(uploadResultSchema.safeParse(result).success).toBe(true);
  });

  it("ignores the many fields we do not keep", () => {
    // Not `strictObject`: this is somebody else's payload, and it gaining a
    // field is not our error to raise.
    expect(uploadResultSchema.safeParse({ ...result, etag: "x", tags: [] }).success).toBe(true);
  });

  it("rejects a response with no usable dimensions", () => {
    expect(uploadResultSchema.safeParse({ ...result, width: 0 }).success).toBe(false);
  });
});

describe("mediaRegisterSchema", () => {
  const item = {
    publicId: "kedland/posts/abc",
    url: "https://res.cloudinary.com/kedland/image/upload/v1/abc.jpg",
    alt: "Children racing on sports day",
    width: 1600,
    height: 1200,
    format: "jpg",
    bytes: 240_000,
  };

  it("accepts a described image", () => {
    expect(mediaRegisterSchema.safeParse(item).success).toBe(true);
  });

  /**
   * Alt text is required, and it lives with the image rather than with each
   * place the image is used. An image with none is one a screen-reader user
   * cannot see at all.
   */
  it("refuses an image with no alt text", () => {
    const { alt: _alt, ...withoutAlt } = item;

    expect(mediaRegisterSchema.safeParse(withoutAlt).success).toBe(false);
    expect(mediaRegisterSchema.safeParse({ ...item, alt: "   " }).success).toBe(false);
  });
});

describe("cloudinaryUrl", () => {
  it("asks Cloudinary to pick the format and quality", () => {
    // `f_auto` is what serves AVIF or WebP per browser, and the reason nobody
    // has to remember to export three versions of every photograph.
    const url = cloudinaryUrl("kedland", "posts/abc");

    expect(url).toContain("f_auto");
    expect(url).toContain("q_auto");
  });

  it("includes the requested dimensions", () => {
    const url = cloudinaryUrl("kedland", "posts/abc", { width: 800, height: 600 });

    expect(url).toContain("w_800");
    expect(url).toContain("h_600");
  });

  it("limits rather than crops, so nobody's head is cut off", () => {
    expect(cloudinaryUrl("kedland", "posts/abc", { width: 800 })).toContain("c_limit");
  });

  it("points at the school's own cloud", () => {
    expect(cloudinaryUrl("kedland", "posts/abc")).toMatch(
      /^https:\/\/res\.cloudinary\.com\/kedland\/image\/upload\//,
    );
  });
});
