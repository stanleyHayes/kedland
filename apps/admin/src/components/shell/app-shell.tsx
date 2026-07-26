"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { Icon } from "@kedland/ui";

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
  user: { displayName: string; email: string; role: UserRole };
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}

export function AppShell({ user, signOutAction, children }: Readonly<AppShellProps>) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Escape closes the drawer, and focus is not left inside something invisible.
  useEffect(() => {
    if (!drawerOpen) return;

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setDrawerOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Desktop sidebar. Sticky rather than fixed, so it scrolls with a very
          long nav instead of clipping it. */}
      <aside className="sticky top-0 hidden h-dvh border-r border-sky bg-white lg:block">
        <Brand />
        <Sidebar userRole={user.role} />
      </aside>

      {/* Phone drawer. */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => {
              setDrawerOpen(false);
            }}
            className="absolute inset-0 bg-navy/40"
          />
          <div className="relative h-full w-72 max-w-[85vw] bg-white shadow-lift">
            <Brand />
            <Sidebar
              userRole={user.role}
              onNavigate={() => {
                setDrawerOpen(false);
              }}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-sky bg-cream/90 px-4 py-3 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => {
              setDrawerOpen(true);
            }}
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
            className="grid size-11 place-items-center rounded-md text-navy hover:bg-sky/40 lg:hidden"
          >
            <Icon name="blocks" className="size-5" />
          </button>

          <div className="min-w-0 flex-1" />

          <div className="hidden text-right sm:block">
            <p className="truncate font-display font-bold text-navy">{user.displayName}</p>
            <p className="truncate text-small capitalize text-grey">{user.role}</p>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              className="flex min-h-11 items-center rounded-pill border-2 border-navy px-4 font-display font-bold text-navy transition-colors hover:bg-navy hover:text-white"
            >
              Sign out
            </button>
          </form>
        </header>

        <main id="main" className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 border-b border-sky px-5 py-4">
      <Image
        src="/logo/kedland-logo-256.png"
        alt=""
        width={256}
        height={256}
        className="size-9 shrink-0 object-contain"
      />
      <span className="font-display text-[1.05rem] font-extrabold leading-tight text-navy">
        Kedland
        <span className="block text-small font-semibold text-grey">Dashboard</span>
      </span>
    </div>
  );
}
