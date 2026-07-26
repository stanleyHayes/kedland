import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PostBody } from "./post-body";
import { PostCard } from "./post-card";

import type { SafeHtml } from "@/lib/markdown";
import type { PostSummary } from "@kedland/types";

const POST: PostSummary = {
  id: "1",
  title: "Our first sports day",
  slug: "our-first-sports-day",
  category: "events",
  excerpt: "A morning of races and medals.",
  coverImage: null,
  status: "published",
  publishedAt: "2026-03-14T09:00:00.000Z",
  seoTitle: null,
  seoDescription: null,
  readingMinutes: 4,
  createdAt: "2026-03-10T09:00:00.000Z",
  updatedAt: "2026-03-14T09:00:00.000Z",
  authorId: null,
};

describe("PostCard", () => {
  it("links to the post by slug", () => {
    render(<PostCard post={POST} cloudName="kedland" />);

    expect(screen.getByRole("link", { name: POST.title })).toHaveAttribute(
      "href",
      "/news/our-first-sports-day",
    );
  });

  /**
   * One link per card. A card where the image, category and date are each
   * separately focusable costs a keyboard user four presses of Tab to pass one
   * post, and gives a screen reader four links to the same place.
   */
  it("has exactly one link", () => {
    render(<PostCard post={POST} cloudName="kedland" />);
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("shows the date in a form a parent reads, and machines can too", () => {
    // Abbreviated: date and reading time share one line, and "14 September
    // 2026" would wrap it on a narrow card.
    render(<PostCard post={POST} cloudName="kedland" />);
    const time = screen.getByText("14 Mar 2026");

    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("dateTime", POST.publishedAt);
  });

  it("names the category", () => {
    render(<PostCard post={POST} cloudName="kedland" />);
    expect(screen.getByText("Events")).toBeInTheDocument();
  });

  it("shows the reading time", () => {
    render(<PostCard post={POST} cloudName="kedland" />);
    expect(screen.getByText("4 min read")).toBeInTheDocument();
  });

  describe("the cover image", () => {
    const withCover: PostSummary = {
      ...POST,
      coverImage: { mediaId: "posts/sports-day", alt: "Children racing on the field" },
    };

    it("uses the alt text the schema required", () => {
      render(<PostCard post={withCover} cloudName="kedland" />);
      expect(screen.getByAltText("Children racing on the field")).toBeInTheDocument();
    });

    it("asks Cloudinary for a sensible size rather than the original", () => {
      render(<PostCard post={withCover} cloudName="kedland" />);
      const image = screen.getByAltText("Children racing on the field");

      // A card does not need a 4000px photograph, and the build package caps
      // imagery at 250 KB.
      expect(image.getAttribute("src")).toContain("w_800");
    });

    /**
     * Cloudinary may not be configured — locally, or before the school's keys
     * are added. A card must still render rather than producing a broken URL.
     */
    it("renders without an image when Cloudinary is not configured", () => {
      render(<PostCard post={withCover} cloudName={undefined} />);

      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: POST.title })).toBeInTheDocument();
    });

    /**
     * The redesign's main point. The old card reserved a 8:5 empty box for a
     * missing image — a blank slab taking half the card and outweighing the
     * headline it sat above.
     */
    it("renders a compact band, not a large empty box, when a post has no cover", () => {
      const { container } = render(<PostCard post={POST} cloudName="kedland" />);

      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      // Still says which category it is, so the space earns itself.
      expect(screen.getByText("Events")).toBeInTheDocument();
      expect(container.querySelector(".aspect-\\[16\\/9\\]")).toBeNull();
    });
  });

  it("shows no date at all for a post that was never published", () => {
    render(<PostCard post={{ ...POST, publishedAt: null }} cloudName="kedland" />);

    // Better nothing than "Invalid Date", which is what formatting null gives.
    expect(screen.queryByText(/Invalid/)).not.toBeInTheDocument();
  });
});

describe("PostBody", () => {
  it("renders the HTML it is given", () => {
    const { container } = render(<PostBody html={"<p>Hello</p>" as SafeHtml} />);
    expect(container.querySelector("p")).toHaveTextContent("Hello");
  });
});
