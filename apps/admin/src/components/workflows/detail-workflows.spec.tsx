import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserDetailWorkflow } from "./account-workflows";
import { FaqDetailWorkflow, InstagramDetailWorkflow } from "./content-workflows";
import { EnquiryDetailWorkflow, MediaDetailWorkflow } from "./operations-workflows";
import { PostEditorWorkflow } from "./publishing-workflows";

import type { Mock } from "vitest";

import { apiFetch } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAdmin: vi.fn() }));

const NOW = "2026-07-26T10:00:00.000Z";

describe("admin record details", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (requireAdmin as Mock).mockResolvedValue(undefined);
  });

  it("shows the complete post body and publishing metadata", async () => {
    (apiFetch as Mock).mockImplementation((path: string) => {
      if (path === "/admin/posts/post-1") {
        return Promise.resolve({
          id: "post-1",
          title: "A joyful school term",
          slug: "a-joyful-school-term",
          category: "news",
          excerpt: "The school welcomed every Star back.",
          body: "## First morning\n\nClassrooms opened with stories, music and purposeful play.",
          coverImage: null,
          status: "published",
          publishedAt: NOW,
          seoTitle: "A joyful school term at Kedland",
          seoDescription: "See how Kedland began the new term.",
          readingMinutes: 2,
          createdAt: NOW,
          updatedAt: NOW,
          authorId: "staff-1",
        });
      }
      throw new Error(`Unexpected path: ${path}`);
    });

    render(await PostEditorWorkflow({ id: "post-1" }));

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("A joyful school term");
    expect(screen.getAllByText(/Classrooms opened with stories/)).toHaveLength(2);
    expect(screen.getByText("Publishing details")).toBeInTheDocument();
    expect(screen.getByText("A joyful school term at Kedland")).toBeInTheDocument();
  });

  it("shows a FAQ answer rather than only its status", async () => {
    (apiFetch as Mock).mockResolvedValue({
      id: "faq-1",
      group: "admissions",
      question: "How do I arrange a tour?",
      answer: "Call the office or use the contact form and choose Book a tour.",
      order: 2,
      published: true,
      createdAt: NOW,
      updatedAt: NOW,
    });

    render(await FaqDetailWorkflow({ id: "faq-1" }));

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("How do I arrange a tour?");
    expect(screen.getAllByText(/Call the office or use the contact form/)).toHaveLength(2);
    expect(screen.getByText("FAQ details")).toBeInTheDocument();
  });

  it("shows enquiry contact, message and follow-up details", async () => {
    (apiFetch as Mock).mockResolvedValue({
      id: "enquiry-1",
      parentName: "Abena Mensah",
      email: "abena@example.com",
      phone: "024 123 4567",
      topic: "book-a-tour",
      level: "nursery-2",
      message: "Please can we visit on Friday morning?",
      status: "new",
      notified: true,
      createdAt: NOW,
      handledAt: null,
      handledBy: null,
    });

    render(await EnquiryDetailWorkflow({ id: "enquiry-1" }));

    expect(screen.getByText("Please can we visit on Friday morning?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reply by email" })).toHaveAttribute(
      "href",
      "mailto:abena@example.com",
    );
    expect(screen.getByText("Follow-up")).toBeInTheDocument();
  });

  it("shows media, showcase and account-specific metadata", async () => {
    const media = {
      id: "media-1",
      publicId: "kedland/reading-corner",
      url: "https://res.cloudinary.com/demo/image/upload/reading.jpg",
      alt: "A quiet reading corner",
      width: 1600,
      height: 1200,
      format: "jpg",
      bytes: 240_000,
      createdAt: NOW,
      uploadedBy: "staff-1",
      depictsPupils: false,
      consentOnFile: false,
      consentRef: null,
    };
    (apiFetch as Mock).mockImplementation((path: string) => {
      if (path === "/admin/media/media-1") return Promise.resolve(media);
      if (path === "/admin/instagram/tile-1") {
        return Promise.resolve({
          id: "tile-1",
          mediaId: "media-1",
          caption: "A calm place for big stories.",
          href: "https://www.instagram.com/p/example",
          order: 3,
          published: true,
          createdAt: NOW,
          updatedAt: NOW,
        });
      }
      if (path === "/admin/media") return Promise.resolve([media]);
      if (path === "/admin/users/user-1") {
        return Promise.resolve({
          id: "user-1",
          email: "mary@kedland.edu.gh",
          displayName: "Mary Owusu",
          avatarUrl: null,
          roleSlug: "editor",
          permissions: ["posts:read", "posts:update"],
          status: "active",
          isInvited: false,
          lastLoginAt: NOW,
          createdAt: NOW,
        });
      }
      if (path === "/admin/roles") {
        return Promise.resolve([{ id: "role-1", slug: "editor", name: "Editor", permissions: [] }]);
      }
      throw new Error(`Unexpected path: ${path}`);
    });

    const mediaView = render(await MediaDetailWorkflow({ id: "media-1" }));
    expect(screen.getByText("Safeguarding")).toBeInTheDocument();
    expect(screen.getByText("kedland/reading-corner")).toBeInTheDocument();
    mediaView.unmount();

    const tileView = render(await InstagramDetailWorkflow({ id: "tile-1" }));
    expect(screen.getAllByText("A calm place for big stories.")).toHaveLength(2);
    expect(screen.getByText("Tile details")).toBeInTheDocument();
    tileView.unmount();

    render(await UserDetailWorkflow({ id: "user-1" }));
    expect(screen.getByText("Permissions (2)")).toBeInTheDocument();

    /*
     * Permissions render as a matrix — one row per resource, one column per
     * action — so "posts" is a single row header, not one row per permission.
     * This used to assert it appeared twice, which was true of an older list
     * layout and had simply stopped describing the page.
     *
     * Asserting the grant state rather than a count is also the better test: it
     * distinguishes a permission the account has from one it does not, which a
     * tally of row headers never could.
     */
    expect(screen.getByRole("rowheader", { name: "posts" })).toBeInTheDocument();
    expect(screen.getByText("posts read: allowed")).toBeInTheDocument();
    expect(screen.getByText("posts update: allowed")).toBeInTheDocument();
    expect(screen.getByText("posts create: not allowed")).toBeInTheDocument();
    expect(screen.getByText("posts delete: not allowed")).toBeInTheDocument();
    // A resource the account holds nothing on is still shown, denied throughout.
    expect(screen.getByText("users read: not allowed")).toBeInTheDocument();
    expect(requireAdmin).toHaveBeenCalled();
  });
});
