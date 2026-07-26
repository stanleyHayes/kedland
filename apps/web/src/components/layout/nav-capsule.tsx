"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

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

/**
 * Marks the page you are on inside a dropdown.
 *
 * A tinted background alone would not do: hover uses a tint too, so on a touch
 * device or after a stray mouse movement the two are indistinguishable — and
 * colour alone is not something a screen-reader user receives at all. The dot
 * is decorative; `aria-current="page"` on the link is what is announced.
 */
function CurrentDot() {
  return <span aria-hidden="true" className="size-2 shrink-0 rounded-pill bg-red" />;
}

interface DropdownProps {
  link: NavLink & { children: NonNullable<NavLink["children"]> };
  pathname: string;
  /** Lets the capsule measure this trigger so the pill can travel to it. */
  registerRef: (node: HTMLElement | null) => void;
  onHover: () => void;
  onLeave: () => void;
}

function NavDropdown({ link, pathname, registerRef, onHover, onLeave }: Readonly<DropdownProps>) {
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
        ref={(node) => {
          triggerRef.current = node;
          registerRef(node);
        }}
        type="button"
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        onFocus={onHover}
        onBlur={onLeave}
        onClick={() => {
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-controls={panelId}
        aria-current={active ? "page" : undefined}
        className={`relative z-10 flex h-10 items-center gap-1.5 rounded-pill px-4 text-[0.95rem] transition-[color,transform] duration-200 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 ${
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
          className="page-enter absolute left-1/2 top-full z-50 mt-3 w-72 -translate-x-1/2 rounded-lg border border-sky bg-white p-2 shadow-lift"
        >
          <Link
            href={link.href}
            onClick={() => {
              setOpen(false);
            }}
            aria-current={pathname === link.href ? "page" : undefined}
            className={`block rounded-md px-3.5 py-2.5 transition-colors ${
              pathname === link.href ? "bg-sky/45" : "hover:bg-cream"
            }`}
          >
            <span className="flex items-center gap-2 font-display font-bold text-navy">
              {link.label} overview
              {pathname === link.href && <CurrentDot />}
            </span>
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
              className={`block rounded-md px-3.5 py-2.5 transition-colors ${
                pathname === child.href ? "bg-sky/45" : "hover:bg-cream"
              }`}
            >
              <span className="flex items-center gap-2 font-display font-bold text-navy">
                {child.label}
                {pathname === child.href && <CurrentDot />}
              </span>
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

/** Where the sliding pill should sit, in pixels within the capsule. */
interface Indicator {
  left: number;
  width: number;
}

export function NavCapsule({ links, pathname, className = "" }: Readonly<NavCapsuleProps>) {
  const capsuleRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLElement>());
  const [indicator, setIndicator] = useState<Indicator | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const activeHref = links.find((link) => isActiveLink(pathname, link))?.href ?? null;

  /**
   * Measures a link and parks the pill on it.
   *
   * Offsets are read relative to the capsule rather than the viewport, so the
   * pill stays correct when the header is sticky or the page is scrolled.
   */
  const moveTo = useCallback((href: string | null) => {
    const capsule = capsuleRef.current;
    const item = href === null ? undefined : itemRefs.current.get(href);

    if (!capsule || !item) {
      setIndicator(null);
      return;
    }

    setIndicator({
      left: item.offsetLeft - capsule.clientLeft,
      width: item.offsetWidth,
    });
  }, []);

  // Layout effect, not effect: the pill must be in place in the same frame the
  // page paints, or it visibly slides in from the left on first load.
  useLayoutEffect(() => {
    moveTo(hovered ?? activeHref);
  }, [hovered, activeHref, moveTo]);

  // Fonts load late and reflow the links under the pill. Re-measuring on resize
  // covers that as well as an actual window resize.
  useEffect(() => {
    const capsule = capsuleRef.current;
    if (!capsule || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      moveTo(hovered ?? activeHref);
    });
    observer.observe(capsule);

    return () => {
      observer.disconnect();
    };
  }, [hovered, activeHref, moveTo]);

  const register = (href: string) => (node: HTMLElement | null) => {
    if (node) itemRefs.current.set(href, node);
    else itemRefs.current.delete(href);
  };

  return (
    <div
      ref={capsuleRef}
      data-testid="nav-capsule"
      className={`relative flex items-center gap-0.5 rounded-pill border border-sky bg-cream/70 p-1.5 ${className}`.trim()}
    >
      {/*
        The pill that follows the pointer.

        Hover is tracked on the links themselves rather than with a mouse-leave
        on this container: a bare `<div onMouseLeave>` is mouse-only behaviour
        attached to something no keyboard can reach. Moving between two links
        fires leave-then-enter in one batch, so the pill goes straight to the
        new link without flicking back through the active one, and focus and
        blur give a keyboard user the same movement.

        One element that moves, rather than a background on each link that fades
        in and out — that is what makes it read as a single object travelling
        between the links instead of two separate highlights blinking. It rests
        on the current page when nothing is hovered, so it doubles as a "you are
        here" marker that is always somewhere sensible.

        Decorative: `aria-current` on the links is what is actually announced.
      */}
      {indicator && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-1.5 top-1.5 z-0 rounded-pill bg-white shadow-card transition-[transform,width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{
            transform: `translateX(${String(indicator.left)}px)`,
            width: `${String(indicator.width)}px`,
          }}
        />
      )}

      {links.map((link) =>
        link.children ? (
          <NavDropdown
            key={link.href}
            link={{ ...link, children: link.children }}
            pathname={pathname}
            registerRef={register(link.href)}
            onHover={() => {
              setHovered(link.href);
            }}
            onLeave={() => {
              setHovered(null);
            }}
          />
        ) : (
          <Link
            key={link.href}
            ref={register(link.href)}
            href={link.href}
            onMouseEnter={() => {
              setHovered(link.href);
            }}
            onMouseLeave={() => {
              setHovered(null);
            }}
            onFocus={() => {
              setHovered(link.href);
            }}
            onBlur={() => {
              setHovered(null);
            }}
            aria-current={isActiveLink(pathname, link) ? "page" : undefined}
            className={`relative z-10 flex h-10 items-center rounded-pill px-4 text-[0.95rem] transition-[color,transform] duration-200 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 ${
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
