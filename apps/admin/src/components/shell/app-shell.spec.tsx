import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell, SIDEBAR_COLLAPSED_KEY } from "./app-shell";
import { onboardingTourStorageKey } from "./onboarding-tour";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

const USER = {
  displayName: "Mary Hayford",
  email: "mary@kedland.edu.gh",
  role: "admin",
  avatarUrl: null,
} as const;

function renderShell() {
  return render(
    <AppShell user={USER} signOutAction={vi.fn()}>
      <p>Page content</p>
    </AppShell>,
  );
}

function renderShellWithAttention() {
  return render(
    <AppShell
      user={USER}
      signOutAction={vi.fn()}
      badges={{ "/enquiries": 3 }}
      attention={[
        {
          href: "/enquiries?status=new",
          icon: "message",
          title: "Parent enquiries",
          description: "New messages are waiting for a response.",
          count: 3,
          tone: "attention",
        },
      ]}
    >
      <p>Page content</p>
    </AppShell>,
  );
}

describe("AppShell", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(onboardingTourStorageKey(USER.email), "complete");
  });

  it("renders the page inside a main landmark", () => {
    renderShell();

    expect(screen.getByRole("main")).toHaveTextContent("Page content");
  });

  it("names who is signed in", () => {
    renderShell();
    expect(screen.getByText("Mary Hayford")).toBeInTheDocument();
  });

  it("opens an account menu with profile, security, settings and sign out", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole("button", { name: /open account menu/i }));

    const menu = screen.getByRole("dialog", { name: /account menu/i });
    expect(menu).toBeInTheDocument();
    expect(within(menu).getByRole("link", { name: /my profile/i })).toHaveAttribute(
      "href",
      "/settings?tab=profile",
    );
    expect(within(menu).getByRole("link", { name: /security/i })).toHaveAttribute(
      "href",
      "/settings?tab=security",
    );
    expect(within(menu).getByRole("link", { name: /settings/i })).toHaveAttribute(
      "href",
      "/settings?tab=appearance",
    );
    expect(within(menu).getByRole("button", { name: /replay tour/i })).toBeInTheDocument();
    expect(within(menu).getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });

  it("opens the onboarding tour once for a user who has not completed it", async () => {
    window.localStorage.removeItem(onboardingTourStorageKey(USER.email));
    renderShell();

    const tour = await screen.findByRole("dialog", { name: /your workspace, at a glance/i });
    expect(tour).toHaveAttribute("aria-modal", "true");
    expect(within(tour).getByText("1 of 5")).toBeInTheDocument();

    await userEvent.click(within(tour).getByRole("button", { name: /skip tour/i }));

    expect(window.localStorage.getItem(onboardingTourStorageKey(USER.email))).toBe("complete");
    expect(screen.queryByRole("dialog", { name: /your workspace, at a glance/i })).not.toBeInTheDocument();
  });

  it("replays the tour from the account menu", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole("button", { name: /open account menu/i }));
    await user.click(screen.getByRole("button", { name: /replay tour/i }));

    expect(await screen.findByRole("dialog", { name: /your workspace, at a glance/i })).toBeInTheDocument();
  });

  it("closes the account menu on Escape and restores focus", async () => {
    const user = userEvent.setup();
    renderShell();

    const trigger = screen.getByRole("button", { name: /open account menu/i });
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog", { name: /account menu/i })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("keeps the public website available as a global action", () => {
    renderShell();
    expect(screen.getByRole("link", { name: /view website/i })).toHaveAttribute(
      "href",
      "http://localhost:3000",
    );
  });

  it("opens attention items from the notification bell", async () => {
    const user = userEvent.setup();
    renderShellWithAttention();

    await user.click(screen.getByRole("button", { name: /notifications, 3 need attention/i }));

    const menu = screen.getByRole("dialog", { name: /items needing attention/i });
    expect(within(menu).getByText("Parent enquiries")).toBeInTheDocument();
    expect(within(menu).getByRole("link", { name: /parent enquiries/i })).toHaveAttribute(
      "href",
      "/enquiries?status=new",
    );
  });

  it("offers a header theme toggle", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole("button", { name: /use dark theme/i }));
    const reveal = document.querySelector(".admin-theme-reveal");
    expect(reveal).not.toBeNull();
    if (reveal) fireEvent.transitionEnd(reveal);

    expect(document.documentElement.dataset["adminTheme"]).toBe("dark");
    expect(window.localStorage.getItem("kedland-admin-theme")).toBe("dark");
    expect(screen.getByRole("button", { name: /use light theme/i })).toBeInTheDocument();
  });

  it("toggles and persists the desktop sidebar from the left of the header", async () => {
    const user = userEvent.setup();
    renderShell();

    const collapse = screen.getByRole("button", { name: "Collapse sidebar" });
    expect(collapse).toHaveAttribute("aria-controls", "desktop-sidebar");

    await user.click(collapse);

    expect(screen.getByRole("button", { name: "Expand sidebar" })).toHaveAttribute("aria-expanded", "false");
    expect(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY)).toBe("true");
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

      expect(screen.getByRole("dialog", { name: /dashboard navigation/i })).toHaveAttribute(
        "aria-modal",
        "true",
      );
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
