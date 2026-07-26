import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Sidebar } from "./sidebar";

const usePathname = vi.fn(() => "/");
vi.mock("next/navigation", () => ({ usePathname: () => usePathname() }));

describe("Sidebar", () => {
  it("marks the current page", () => {
    usePathname.mockReturnValue("/posts");
    render(<Sidebar userRole="admin" />);

    expect(screen.getByRole("link", { name: /posts/i })).toHaveAttribute("aria-current", "page");
  });

  it("treats a nested route as being under its section", () => {
    usePathname.mockReturnValue("/posts/abc123");
    render(<Sidebar userRole="admin" />);

    expect(screen.getByRole("link", { name: /posts/i })).toHaveAttribute("aria-current", "page");
  });

  it("does not mark Overview for every route, since it is an exact match", () => {
    // `/` is a prefix of everything; without `exact` it would always look
    // current.
    usePathname.mockReturnValue("/posts");
    render(<Sidebar userRole="admin" />);

    expect(screen.getByRole("link", { name: /overview/i })).not.toHaveAttribute("aria-current");
  });

  /**
   * Presentation only — the API's guard is what refuses an editor, and
   * `requireAdmin` is what stops the page rendering. This just avoids showing
   * somebody a door they cannot open.
   */
  it("hides administrator-only sections from an editor", () => {
    usePathname.mockReturnValue("/");
    render(<Sidebar userRole="editor" />);

    expect(screen.queryByRole("link", { name: /users/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /audit/i })).not.toBeInTheDocument();
  });

  it("shows them to an administrator", () => {
    usePathname.mockReturnValue("/");
    render(<Sidebar userRole="admin" />);

    expect(screen.getByRole("link", { name: /users/i })).toBeInTheDocument();
  });

  it("still shows an editor the sections they can use", () => {
    usePathname.mockReturnValue("/");
    render(<Sidebar userRole="editor" />);

    expect(screen.getByRole("link", { name: /posts/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /inbox/i })).toBeInTheDocument();
  });

  it("is a labelled landmark, so it can be skipped", () => {
    render(<Sidebar userRole="admin" />);
    expect(screen.getByRole("navigation", { name: "Dashboard" })).toBeInTheDocument();
  });
});
