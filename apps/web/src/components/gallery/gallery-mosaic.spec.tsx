import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GalleryMosaic } from "./gallery-mosaic";

import type { PublicGalleryTile } from "@kedland/types";

const tiles: PublicGalleryTile[] = [
  {
    id: "one",
    caption: "Creative table",
    href: "https://example.com/one",
    order: 0,
    media: { id: "media-one", url: "/one.webp", alt: "Paints on a table", width: 800, height: 800 },
  },
  {
    id: "two",
    caption: "Reading corner",
    href: "https://example.com/two",
    order: 1,
    media: { id: "media-two", url: "/two.webp", alt: "Books and cushions", width: 800, height: 1200 },
  },
];

describe("GalleryMosaic", () => {
  it("opens an accessible carousel and supports keyboard navigation", () => {
    render(<GalleryMosaic tiles={tiles} />);

    fireEvent.click(screen.getByRole("button", { name: /open photo 1/i }));
    expect(screen.getByRole("dialog", { name: /photo 1 of 2/i })).toBeInTheDocument();
    expect(within(screen.getByRole("dialog")).getByText("Creative table")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(within(screen.getByRole("dialog")).getByText("Reading corner")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("uses a dense six-position mosaic recipe", () => {
    const { container } = render(<GalleryMosaic tiles={tiles} />);
    expect(container.querySelector(".gallery-mosaic")).toBeInTheDocument();
    expect(container.querySelector(".gallery-tile-1")).toBeInTheDocument();
    expect(container.querySelector(".gallery-tile-2")).toBeInTheDocument();
  });
});
