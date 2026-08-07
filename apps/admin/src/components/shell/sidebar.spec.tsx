import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Sidebar, SIDEBAR_GROUPS_KEY } from "./sidebar";

const usePathname = vi.fn(() => "/");
vi.mock("next/navigation", () => ({ usePathname: () => usePathname() }));

describe("Sidebar", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("marks the current page", () => {
    usePathname.mockReturnValue("/posts");
    render(<Sidebar userRole="admin" />);

    const postsLink = screen.getByRole("link", { name: /posts/i });
    expect(postsLink).toHaveAttribute("aria-current", "page");
    expect(postsLink).toHaveClass("admin-nav-active");
  });

  it("keeps expanded subgroup links inside the indented connector rail", () => {
    usePathname.mockReturnValue("/instagram");
    render(<Sidebar userRole="admin" />);

    // Named for where it appears on the site, not for the app the photos came
    // from — see the note in nav-config.ts.
    const instagramLink = screen.getByRole("link", { name: "Gallery images" });
    expect(instagramLink).toHaveClass("min-w-0", "px-3");
    expect(instagramLink).not.toHaveClass("pl-9");
    expect(instagramLink.closest("li")).toHaveClass("admin-nav-child");
    expect(instagramLink.closest(".admin-nav-branch")).toBeInTheDocument();
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

  it("collapses each group independently and persists the choice", async () => {
    const user = userEvent.setup();
    usePathname.mockReturnValue("/");
    render(<Sidebar userRole="admin" />);

    const contentToggle = screen.getByRole("button", { name: "Collapse Content" });
    expect(contentToggle).toHaveAttribute("aria-expanded", "true");

    await user.click(contentToggle);

    expect(screen.queryByRole("link", { name: "Pages" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Posts" })).toBeInTheDocument();
    expect(window.localStorage.getItem(SIDEBAR_GROUPS_KEY)).toContain('"Content":false');
  });

  it("keeps labels available in the compact rail", () => {
    usePathname.mockReturnValue("/");
    render(<Sidebar userRole="admin" collapsed />);

    expect(screen.getByRole("link", { name: "Posts" })).toHaveAttribute("title", "Posts");
    expect(screen.getByRole("button", { name: "Collapse Publishing" })).toHaveAttribute(
      "title",
      "Publishing",
    );
  });
});
