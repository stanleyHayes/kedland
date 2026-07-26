"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { Icon, buttonClasses, ArrowChip, Star } from "@kedland/ui";

import { isActiveLink, NAV_CTA, NAV_LINKS, QUICK_LINKS } from "./nav-config";

/**
 * The full-screen mobile menu — build package §3: "hamburger → full-screen
 * playful menu, large tap targets".
 *
 * Sub-pages are listed inline rather than behind another disclosure. On a phone
 * an extra tap to reveal four links is friction with nothing to gain, and the
 * whole panel scrolls anyway.
 *
 * Focus is trapped while open, the page behind cannot scroll, and Escape
 * closes — the three things that make an overlay usable rather than a trap.
 */

/** External links open in a new tab; the admission form downloads. */
function outboundProps(item: { external?: boolean }): Record<string, unknown> {
  return item.external === true ? { target: "_blank", rel: "noreferrer noopener" } : { download: true };
}

export interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  pathname: string;
}

export function MobileMenu({ open, onClose, pathname }: Readonly<MobileMenuProps>) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    // Focus moves into the panel so the next Tab is inside it, not behind it.
    closeRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      data-testid="mobile-menu"
      className="fixed inset-0 z-100 flex flex-col overflow-y-auto bg-cream lg:hidden"
    >
      {/* Playful, per the build package — a few stars drifting behind the links.
          Kept to the margins and faint: decoration must not compete with the
          text it sits behind. */}
      <Star className="pointer-events-none absolute -right-6 top-24 -z-10 size-20 text-yellow/25" />
      <Star className="pointer-events-none absolute -left-10 top-72 -z-10 size-28 text-sky/30" />
      <Star className="pointer-events-none absolute -right-4 bottom-32 -z-10 size-16 text-pink/15" />

      <div className="flex items-center justify-between px-5 py-5">
        <span className="font-display text-h3 font-extrabold text-navy">Menu</span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="grid size-12 place-items-center rounded-pill border border-sky bg-white text-navy"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            className="size-5"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <nav aria-label="Mobile" className="relative flex-1 px-5 pb-8">
        <ul className="flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={onClose}
                aria-current={isActiveLink(pathname, link) ? "page" : undefined}
                className={`flex min-h-14 items-center rounded-md px-4 font-display text-[1.3rem] font-bold ${
                  isActiveLink(pathname, link) ? "bg-white text-navy shadow-card" : "text-navy"
                }`}
              >
                {link.label}
              </Link>

              {link.children && (
                <ul className="mb-1 ml-4 border-l-2 border-sky pl-4">
                  {link.children.map((child) => (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        onClick={onClose}
                        aria-current={pathname === child.href ? "page" : undefined}
                        className={`flex min-h-12 items-center gap-3 text-[1.02rem] ${
                          pathname === child.href ? "font-bold text-navy" : "font-semibold text-grey"
                        }`}
                      >
                        {/* Same icons as the desktop dropdown, so the two read
                            as one navigation rather than two. */}
                        <span
                          className={`grid size-7 shrink-0 place-items-center rounded-md ${
                            pathname === child.href ? "bg-navy text-white" : "bg-sky/50 text-navy"
                          }`}
                        >
                          <Icon name={child.icon} className="size-3.5" />
                        </span>
                        {child.label}
                        {/* Same marker as the desktop dropdown. Weight alone is
                            too quiet to spot in a list of eight. */}
                        {pathname === child.href && (
                          <span aria-hidden="true" className="size-2 shrink-0 rounded-pill bg-red" />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        <Link
          href={NAV_CTA.href}
          onClick={onClose}
          className={buttonClasses({ size: "lg", className: "mt-7 w-full" })}
        >
          {NAV_CTA.label}
          <ArrowChip />
        </Link>

        <p className="mt-9 text-small font-bold uppercase tracking-[0.06em] text-grey">Quick links</p>
        <ul className="mt-3 flex flex-col gap-1">
          {QUICK_LINKS.map((item) => (
            <li key={`${item.href}-${item.label}`}>
              {item.external === true || item.download === true ? (
                <a
                  href={item.href}
                  onClick={onClose}
                  className="flex min-h-12 items-center font-semibold text-navy"
                  {...outboundProps(item)}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="flex min-h-12 items-center font-semibold text-navy"
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
