"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { isActiveLink, type NavLink } from "./nav-config";

/**
 * The centred nav capsule from variant 4 — a rounded pill holding the links,
 * with About and Academics expanding into small dropdowns.
 *
 * Keyboard contract (build package §2.6 / agent_plan §6.8): the trigger is a
 * real button with `aria-expanded` and `aria-controls`, Escape closes and
 * returns focus to it, and a click outside dismisses. A parent navigating by
 * keyboard should never end up somewhere they cannot get out of.
 */

interface DropdownProps {
  link: NavLink & { children: NonNullable<NavLink["children"]> };
  pathname: string;
}

function NavDropdown({ link, pathname }: Readonly<DropdownProps>) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const active = isActiveLink(pathname, link);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    const onPointerDown = (event: MouseEvent): void => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-controls={panelId}
        aria-current={active ? "page" : undefined}
        className={`flex h-10 items-center gap-1.5 rounded-pill px-4 text-[0.95rem] transition-colors ${
          active ? "font-bold text-navy" : "font-semibold text-grey hover:text-navy"
        }`}
      >
        {link.label}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          className={`size-3.5 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
        {active && (
          <span aria-hidden="true" className="absolute inset-x-4 bottom-0.5 h-[3px] rounded-pill bg-red" />
        )}
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute left-1/2 top-full z-50 mt-3 w-72 -translate-x-1/2 rounded-lg border border-sky bg-white p-2 shadow-lift"
        >
          <Link
            href={link.href}
            onClick={() => {
              setOpen(false);
            }}
            className="block rounded-md px-3.5 py-2.5 transition-colors hover:bg-cream"
          >
            <span className="block font-display font-bold text-navy">{link.label} overview</span>
          </Link>

          <span aria-hidden="true" className="my-1 block h-px bg-sky" />

          {link.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={() => {
                setOpen(false);
              }}
              aria-current={pathname === child.href ? "page" : undefined}
              className="block rounded-md px-3.5 py-2.5 transition-colors hover:bg-cream"
            >
              <span className="block font-display font-bold text-navy">{child.label}</span>
              <span className="mt-0.5 block text-small text-grey">{child.description}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export interface NavCapsuleProps {
  links: readonly NavLink[];
  pathname: string;
  className?: string;
}

export function NavCapsule({ links, pathname, className = "" }: Readonly<NavCapsuleProps>) {
  return (
    <div
      data-testid="nav-capsule"
      className={`flex items-center gap-0.5 rounded-pill border border-sky bg-cream/70 p-1.5 ${className}`.trim()}
    >
      {links.map((link) =>
        link.children ? (
          <NavDropdown key={link.href} link={{ ...link, children: link.children }} pathname={pathname} />
        ) : (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActiveLink(pathname, link) ? "page" : undefined}
            className={`relative flex h-10 items-center rounded-pill px-4 text-[0.95rem] transition-colors ${
              isActiveLink(pathname, link) ? "font-bold text-navy" : "font-semibold text-grey hover:text-navy"
            }`}
          >
            {link.label}
            {isActiveLink(pathname, link) && (
              <span
                aria-hidden="true"
                className="absolute inset-x-4 bottom-0.5 h-[3px] rounded-pill bg-red"
              />
            )}
          </Link>
        ),
      )}
    </div>
  );
}
