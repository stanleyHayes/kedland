import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buildHero } from "@kedland/testing";

import { HeroSlideshow } from "./hero-slideshow";

const data = {
  ...buildHero(),
  slides: [
    { image: { mediaId: "one", alt: "School garden", src: "/one.jpg" } },
    { image: { mediaId: "two", alt: "School playground", src: "/two.jpg" } },
  ],
};

afterEach(() => vi.useRealTimers());

describe("Hero slideshow", () => {
  it("cycles selected images and pauses when requested", async () => {
    vi.useFakeTimers();
    render(<HeroSlideshow data={data} />);
    expect(screen.getByRole("img", { name: "School garden" })).toBeVisible();
    await act(() => vi.advanceTimersByTime(6000));
    expect(screen.getByRole("img", { name: "School playground" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Pause slideshow" }));
    await act(() => vi.advanceTimersByTime(6000));
    expect(screen.getByRole("img", { name: "School playground" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Show photograph 1" }));
    expect(screen.getByRole("img", { name: "School garden" })).toBeVisible();
    expect(screen.queryByText(data.subheading)).not.toBeInTheDocument();
  });

  it("keeps existing content working when no carousel images are configured", () => {
    render(<HeroSlideshow data={buildHero()} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(data.heading);
    expect(screen.queryByRole("button", { name: /slideshow/i })).not.toBeInTheDocument();
  });
});
