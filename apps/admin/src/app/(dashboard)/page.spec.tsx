import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type * as ApiModule from "@/lib/api";

import { ApiError } from "@/lib/api";

const apiFetch = vi.fn();
const requireUser = vi.fn();

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof ApiModule>()),
  apiFetch: (path: string) => apiFetch(path) as unknown,
}));

vi.mock("@/lib/auth", () => ({
  requireUser: () => requireUser() as unknown,
}));

const { default: OverviewPage } = await import("./page");

const USER = { id: "1", email: "mary@kedland.edu.gh", displayName: "Mary Hayford", role: "admin" };

/** Renders the async server component. */
async function renderPage() {
  render(await OverviewPage());
}

describe("OverviewPage", () => {
  beforeEach(() => {
    requireUser.mockResolvedValue(USER);
    apiFetch.mockImplementation((path: string) => {
      if (path.startsWith("/admin/enquiries/counts")) {
        return Promise.resolve({ unread: 3, undelivered: 0 });
      }
      return Promise.resolve({ items: [], total: 0, page: 1, pageSize: 5, totalPages: 0 });
    });
  });

  it("greets the person signing in by name", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Mary");
  });

  it("shows how many enquiries are waiting", async () => {
    await renderPage();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("keeps headings in order — one h1, then h2s", async () => {
    await renderPage();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 2 }).length).toBeGreaterThan(0);
  });

  it("invites the school to write its first post when there are none", async () => {
    await renderPage();
    expect(screen.getByText(/first story/i)).toBeInTheDocument();
  });

  /**
   * The distinction this page exists to get right. Showing "0 enquiries"
   * because the API is unreachable tells the office there is nothing waiting —
   * the one wrong answer that costs them a parent.
   */
  describe("when a figure cannot be read", () => {
    beforeEach(() => {
      apiFetch.mockImplementation((path: string) => {
        if (path.startsWith("/admin/enquiries/counts")) {
          return Promise.reject(new ApiError(503, "unreachable"));
        }
        return Promise.resolve({ items: [], total: 0, page: 1, pageSize: 5, totalPages: 0 });
      });
    });

    it("shows a dash for the figure it could not read", async () => {
      await renderPage();

      // Two dashes: unread and undelivered, both from the failed counts call.
      expect(screen.getAllByText("—")).toHaveLength(2);
    });

    it("still shows a genuine zero for the figure it could read", async () => {
      // Drafts really is zero here — the posts call succeeded. A blanket "no
      // zeroes when anything failed" rule would hide a true answer.
      await renderPage();
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    /**
     * Scoped to the source that failed, not the page. The posts section below
     * is working and must stay visible.
     */
    it("names the failed source, rather than letting the dash speak for itself", async () => {
      await renderPage();

      expect(screen.getByText(/Enquiry figures could not be loaded/i)).toBeInTheDocument();
      // The working section is still there.
      expect(screen.getByRole("heading", { name: /latest posts/i })).toBeInTheDocument();
    });
  });

  it("flags undelivered enquiries, which always mean somebody was never told", async () => {
    apiFetch.mockImplementation((path: string) =>
      path.startsWith("/admin/enquiries/counts")
        ? Promise.resolve({ unread: 0, undelivered: 2 })
        : Promise.resolve({ items: [], total: 0, page: 1, pageSize: 5, totalPages: 0 }),
    );

    await renderPage();

    expect(screen.getByText("Not emailed")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/2 enquiries were not emailed/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /review inbox/i })).toHaveAttribute("href", "/enquiries");
  });

  it("shows an all-clear state only when every source loaded successfully", async () => {
    apiFetch.mockImplementation((path: string) =>
      path.startsWith("/admin/enquiries/counts")
        ? Promise.resolve({ unread: 0, undelivered: 0 })
        : Promise.resolve({ items: [], total: 0, page: 1, pageSize: 5, totalPages: 0 }),
    );

    await renderPage();

    expect(screen.getByText(/nothing urgent is waiting/i)).toBeInTheDocument();
    expect(screen.getByText("Live data")).toBeInTheDocument();
  });
});
