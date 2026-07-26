import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AppShell } from "./app-shell";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

const USER = { displayName: "Mary Hayford", email: "mary@kedland.edu.gh", role: "admin" } as const;

function renderShell() {
  return render(
    <AppShell user={USER} signOutAction={vi.fn()}>
      <p>Page content</p>
    </AppShell>,
  );
}

describe("AppShell", () => {
  it("renders the page inside a main landmark", () => {
    renderShell();

    expect(screen.getByRole("main")).toHaveTextContent("Page content");
  });

  it("names who is signed in", () => {
    renderShell();
    expect(screen.getByText("Mary Hayford")).toBeInTheDocument();
  });

  it("offers a way out", () => {
    renderShell();
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });

  describe("the phone drawer", () => {
    it("is closed to begin with", () => {
      renderShell();
      expect(screen.getByRole("button", { name: /open navigation/i })).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });

    it("opens", async () => {
      const user = userEvent.setup();
      renderShell();

      await user.click(screen.getByRole("button", { name: /open navigation/i }));

      expect(screen.getByRole("button", { name: /close navigation/i })).toBeInTheDocument();
    });

    /**
     * Escape, because a drawer that can only be dismissed by finding a small
     * target is a trap for anybody navigating by keyboard.
     */
    it("closes on Escape", async () => {
      const user = userEvent.setup();
      renderShell();

      await user.click(screen.getByRole("button", { name: /open navigation/i }));
      await user.keyboard("{Escape}");

      expect(screen.queryByRole("button", { name: /close navigation/i })).not.toBeInTheDocument();
    });

    it("closes when the backdrop is clicked", async () => {
      const user = userEvent.setup();
      renderShell();

      await user.click(screen.getByRole("button", { name: /open navigation/i }));
      await user.click(screen.getByRole("button", { name: /close navigation/i }));

      expect(screen.queryByRole("button", { name: /close navigation/i })).not.toBeInTheDocument();
    });
  });
});
