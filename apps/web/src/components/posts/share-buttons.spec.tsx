import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ShareButtons } from "./share-buttons";

describe("ShareButtons", () => {
  const url = "https://kedland.edu.gh/news/sports-day";
  const title = "Sports day highlights";

  it("offers WhatsApp, Facebook, X, LinkedIn and copy-link", () => {
    render(<ShareButtons url={url} title={title} />);

    expect(screen.getByRole("link", { name: "Share on WhatsApp" })).toHaveAttribute(
      "href",
      expect.stringContaining("wa.me"),
    );
    expect(screen.getByRole("link", { name: "Share on Facebook" })).toHaveAttribute(
      "href",
      expect.stringContaining("facebook.com/sharer"),
    );
    expect(screen.getByRole("link", { name: "Share on X" })).toHaveAttribute(
      "href",
      expect.stringContaining("twitter.com/intent/tweet"),
    );
    expect(screen.getByRole("link", { name: "Share on LinkedIn" })).toHaveAttribute(
      "href",
      expect.stringContaining("linkedin.com/sharing"),
    );
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
  });

  it("copies the absolute URL to the clipboard", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<ShareButtons url={url} title={title} />);
    await user.click(screen.getByRole("button", { name: "Copy link" }));

    expect(writeText).toHaveBeenCalledWith(url);
    expect(screen.getByRole("button", { name: "Link copied" })).toBeInTheDocument();
  });
});
