import { describe, expect, it } from "vitest";

import { postCoverUrl } from "./post-cover";

describe("postCoverUrl", () => {
  it("keeps bundled starter media on the public site's own origin", () => {
    expect(postCoverUrl("kedland-starter-reading-corner", "cloud-name", 1600)).toBe(
      "/images/cms-starter/reading-corner.webp",
    );
  });

  it("builds a transformed Cloudinary URL for dashboard uploads", () => {
    expect(postCoverUrl("posts/sports-day", "cloud-name", 800)).toContain(
      "res.cloudinary.com/cloud-name/image/upload/f_auto,q_auto,w_800,c_limit/posts/sports-day",
    );
  });

  it("returns no source for an upload when Cloudinary is unavailable", () => {
    expect(postCoverUrl("posts/sports-day", undefined, 800)).toBeNull();
  });
});
