"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Icon } from "@kedland/ui";

import type { UserRole } from "@kedland/types";

interface AccountMenuProps {
  user: { displayName: string; email: string; role: UserRole };
  signOutAction: () => Promise<void>;
}

const ACCOUNT_LINKS = [
  {
    href: "/settings?tab=profile",
    icon: "user",
    label: "My profile",
    description: "Identity and account details",
  },
  {
    href: "/settings?tab=security",
    icon: "shield",
    label: "Security",
    description: "Password and active sessions",
  },
  {
    href: "/settings?tab=appearance",
    icon: "palette",
    label: "Settings",
    description: "Theme and workspace preferences",
  },
  {
    href: "/help",
    icon: "book",
    label: "Dashboard guide",
    description: "Review the staff workflow guide",
  },
] as const;

export function AccountMenu({ user, signOutAction }: Readonly<AccountMenuProps>) {
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;

    const closeOnOutsidePress = (event: PointerEvent): void => {
      if (event.target instanceof Node && !menu.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    };

    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={menu} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-label="Open account menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);
        }}
        className={`admin-account-trigger flex min-h-12 items-center gap-2 p-1.5 pr-2.5 text-left ${
          open ? "admin-account-trigger-open" : ""
        }`}
      >
        <span className="admin-avatar grid size-9 shrink-0 place-items-center text-[0.72rem] font-extrabold uppercase text-white sm:size-10">
          {initials(user.displayName)}
        </span>
        <span className="hidden min-w-0 xl:block">
          <span className="block max-w-36 truncate font-display text-small font-bold text-navy">
            {user.displayName}
          </span>
          <span className="block truncate text-[0.7rem] capitalize text-grey">{user.role}</span>
        </span>
        <Icon
          name="chevron-down"
          className={`hidden size-4 shrink-0 text-grey transition-transform sm:block ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <section
          role="dialog"
          aria-label="Account menu"
          className="admin-account-menu absolute right-0 top-[calc(100%+0.7rem)] z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg"
        >
          <header className="border-b border-sky/55 px-5 py-5">
            <p className="truncate font-display text-lg font-extrabold text-navy">{user.displayName}</p>
            <p className="mt-1 truncate text-small text-grey">{user.email}</p>
            <p className="mt-1 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-blue">
              {user.role} account
            </p>
          </header>

          <nav aria-label="Account shortcuts" className="space-y-1 p-2.5">
            {ACCOUNT_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setOpen(false);
                }}
                className="admin-account-menu-item flex items-center gap-3 rounded-md px-3 py-3"
              >
                <span className="admin-account-menu-icon grid size-10 shrink-0 place-items-center rounded-md text-blue">
                  <Icon name={item.icon} className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-display font-bold text-navy">{item.label}</span>
                  <span className="mt-0.5 block text-small text-grey">{item.description}</span>
                </span>
              </Link>
            ))}
          </nav>

          <form action={signOutAction} className="border-t border-sky/55 p-2.5">
            <button
              type="submit"
              className="admin-account-signout flex w-full items-center gap-3 rounded-md px-3 py-3 text-left"
            >
              <span className="admin-account-signout-icon grid size-10 shrink-0 place-items-center rounded-md text-red-text">
                <Icon name="user" className="size-5" />
              </span>
              <span>
                <span className="block font-display font-bold text-red-text">Sign out</span>
                <span className="mt-0.5 block text-small text-grey">End this session on this device</span>
              </span>
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

function initials(displayName: string): string {
  return displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("");
}
