"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Icon } from "@kedland/ui";

import { AccountMenu } from "./account-menu";
import { AdminThemeToggle } from "./admin-theme-toggle";
import { AttentionMenu, type ShellAttention } from "./attention-menu";
import { NAV_GROUPS } from "./nav-config";
import { OnboardingTour } from "./onboarding-tour";
import { Sidebar } from "./sidebar";

import type { UserRole } from "@kedland/types";

/**
 * The dashboard chrome: fixed sidebar on a desktop, a drawer on a phone.
 *
 * The sidebar is a client component because it reads the current path and,
 * on small screens, opens and closes. Everything inside `children` is still
 * server-rendered — the shell wraps it, it does not own it.
 */
export interface AppShellProps {
  user: { displayName: string; email: string; role: UserRole; avatarUrl: string | null };
  signOutAction: () => Promise<void>;
  attention?: ShellAttention[] | undefined;
  badges?: Record<string, number> | undefined;
  children: React.ReactNode;
}

export const SIDEBAR_COLLAPSED_KEY = "kedland-admin-sidebar-collapsed";

/**
 * Which section the operator is in, for the top bar.
 *
 * Read from the same nav data the sidebar uses, so the two can never disagree
 * about where you are. The longest matching href wins — otherwise "/" would
 * claim every route.
 */
function currentSection(pathname: string): string {
  const items = NAV_GROUPS.flatMap((group) => group.items);
  const match = items
    .filter((item) => (item.exact === true ? pathname === item.href : pathname.startsWith(item.href)))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return match?.label ?? "Dashboard";
}

export function AppShell({
  user,
  signOutAction,
  attention = [],
  badges = {},
  children,
}: Readonly<AppShellProps>) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tourReplaySignal, setTourReplaySignal] = useState(0);
  const drawerTrigger = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const siteUrl = process.env["NEXT_PUBLIC_SITE_URL"] ?? "http://localhost:3000";

  const closeDrawer = useCallback((): void => {
    setDrawerOpen(false);
    setTimeout(() => {
      drawerTrigger.current?.focus();
    }, 0);
  }, []);

  // Escape closes the drawer, and focus is not left inside something invisible.
  useEffect(() => {
    if (!drawerOpen) return;

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") closeDrawer();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeDrawer, drawerOpen]);

  useEffect(() => {
    const restorePreference = window.setTimeout(() => {
      setSidebarCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");
    }, 0);

    return () => {
      window.clearTimeout(restorePreference);
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = (): void => {
      const preference = window.localStorage.getItem("kedland-admin-theme") ?? "light";
      const dark = preference === "dark" || (preference === "system" && media.matches);
      document.documentElement.dataset["adminTheme"] = dark ? "dark" : "light";
    };

    applyTheme();
    media.addEventListener("change", applyTheme);
    window.addEventListener("kedland-admin-theme", applyTheme);
    return () => {
      media.removeEventListener("change", applyTheme);
      window.removeEventListener("kedland-admin-theme", applyTheme);
    };
  }, []);

  const toggleSidebar = (): void => {
    setSidebarCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  };

  return (
    <div
      className={`admin-shell min-h-dvh lg:grid ${
        sidebarCollapsed ? "lg:grid-cols-[5.5rem_minmax(0,1fr)]" : "lg:grid-cols-[17.5rem_minmax(0,1fr)]"
      }`}
    >
      {/* Desktop sidebar. Sticky rather than fixed, so it scrolls with a very
          long nav instead of clipping it. */}
      <aside
        id="desktop-sidebar"
        data-tour="sidebar"
        className="admin-rail sticky top-0 hidden h-dvh overflow-hidden bg-navy-deep text-white transition-[width] duration-200 lg:block"
      >
        <Brand collapsed={sidebarCollapsed} />
        <Sidebar userRole={user.role} badges={badges} collapsed={sidebarCollapsed} idPrefix="desktop" />
      </aside>

      {/* Phone drawer. */}
      {drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Dashboard navigation"
          className="fixed inset-0 z-50 lg:hidden"
        >
          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeDrawer}
            className="absolute inset-0 bg-navy-deep/70 backdrop-blur-[2px]"
          />
          <div className="admin-rail relative h-full w-[18rem] max-w-[88vw] overflow-hidden bg-navy-deep text-white shadow-lift">
            <Brand onClose={closeDrawer} />
            <Sidebar userRole={user.role} badges={badges} idPrefix="mobile" onNavigate={closeDrawer} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="admin-topbar sticky top-0 z-40 flex min-h-[4.75rem] items-center gap-3 border-b border-sky/70 bg-cream/88 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button
            ref={drawerTrigger}
            data-tour="mobile-nav"
            type="button"
            onClick={() => {
              setDrawerOpen(true);
            }}
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
            className="admin-icon-button grid size-11 place-items-center text-navy lg:hidden"
          >
            <Icon name="blocks" className="size-5" />
          </button>

          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!sidebarCollapsed}
            aria-controls="desktop-sidebar"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="admin-icon-button hidden size-11 place-items-center text-navy lg:grid"
          >
            <Icon
              name="chevron-down"
              className={`size-5 transition-transform duration-200 ${
                sidebarCollapsed ? "-rotate-90" : "rotate-90"
              }`}
            />
          </button>

          {/* Orientation first: the skill's opening question is "where am I?",
              and the top bar is where the answer belongs when the sidebar is
              off-screen. */}
          <div className="min-w-0 flex-1">
            <p className="hidden text-[0.68rem] font-bold uppercase tracking-[0.12em] text-grey sm:block">
              Kedland workspace
            </p>
            <p className="truncate font-display text-[1.05rem] font-bold text-navy">
              {currentSection(pathname)}
            </p>
          </div>

          <Link
            href={siteUrl}
            target="_blank"
            rel="noreferrer"
            className="admin-topbar-link hidden min-h-10 items-center gap-2 px-3 text-small font-bold text-navy md:flex"
          >
            <Icon name="globe" className="size-4 text-blue" />
            View website
          </Link>

          <AdminThemeToggle />
          <AttentionMenu items={attention} />

          <div data-tour="account" className="border-l border-sky/70 pl-2 sm:pl-4">
            <AccountMenu
              user={user}
              signOutAction={signOutAction}
              onReplayTour={() => {
                setTourReplaySignal((current) => current + 1);
              }}
            />
          </div>
        </header>

        <main id="main" className="admin-workspace min-w-0 flex-1 px-4 py-7 sm:px-6 sm:py-9 lg:px-10">
          {children}
        </main>
      </div>
      <OnboardingTour userEmail={user.email} replaySignal={tourReplaySignal} />
    </div>
  );
}

function Brand({ onClose, collapsed = false }: Readonly<{ onClose?: () => void; collapsed?: boolean }>) {
  return (
    <div
      className={`relative flex min-h-[5.75rem] items-center border-b border-white/10 ${
        collapsed ? "justify-center px-2" : "gap-3 px-5"
      }`}
    >
      <span className="pointer-events-none absolute -left-8 top-1/2 size-24 -translate-y-1/2 rounded-full bg-blue/15 blur-2xl" />
      <span className="relative grid size-11 shrink-0 place-items-center rounded-[0.7rem] bg-cream shadow-[0_8px_22px_rgb(3_24_36/0.3)]">
        <Image
          src="/logo/kedland-logo-256.png"
          alt=""
          width={256}
          height={256}
          className="size-9 object-contain"
        />
      </span>
      {!collapsed && (
        <span className="relative min-w-0 flex-1 font-display text-[1.05rem] font-extrabold leading-tight text-white">
          Kedland
          <span className="mt-0.5 block text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-sky/65">
            Staff console
          </span>
        </span>
      )}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="grid size-10 place-items-center rounded-md border border-white/10 text-white/75 hover:bg-white/10 hover:text-white"
        >
          <Icon name="chevron-down" className="size-4 rotate-90" />
        </button>
      )}
    </div>
  );
}
