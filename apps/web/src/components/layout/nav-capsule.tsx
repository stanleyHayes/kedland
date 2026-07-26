"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import { Icon } from "@kedland/ui";

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
  /** Text colour and weight, decided by where the sliding pill currently is. */
  tone: string;
  onHover: () => void;
  onLeave: () => void;
}

function NavDropdown({ link, pathname, registerRef, tone, onHover, onLeave }: Readonly<DropdownProps>) {
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
        className={`relative z-10 flex h-10 items-center gap-1.5 rounded-pill px-4 text-[0.95rem] transition-[color,transform] duration-200 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 ${tone}`}
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
      </button>

      {open && (
        <div
          id={panelId}
          className="page-enter absolute left-1/2 top-full z-50 mt-3 w-80 -translate-x-1/2 rounded-lg border border-sky bg-white p-2 shadow-lift"
        >
          <Link
            href={link.href}
            onClick={() => {
              setOpen(false);
            }}
            aria-current={pathname === link.href ? "page" : undefined}
            className={`group/item block rounded-md px-3.5 py-2.5 transition-colors ${
              pathname === link.href ? "bg-sky/45" : "hover:bg-cream"
            }`}
          >
            <span className="flex items-center gap-3 font-display font-bold text-navy">
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-sky/50 text-navy transition-transform duration-200 group-hover/item:scale-110 motion-reduce:transition-none motion-reduce:group-hover/item:scale-100">
                <Icon name="star" className="size-4" />
              </span>
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
              className={`group/item flex items-start gap-3 rounded-md px-3.5 py-2.5 transition-colors ${
                pathname === child.href ? "bg-sky/45" : "hover:bg-cream"
              }`}
            >
              {/*
                The icon lifts and tints on hover, so the row answers the
                pointer the way the main nav's pill does — small, quick, and in
                the same direction of travel. `group/item` scopes it to this
                row; an unnamed group would also fire from the capsule above.
              */}
              <span
                className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-md transition-[transform,background-color,color] duration-200 group-hover/item:scale-110 motion-reduce:transition-none motion-reduce:group-hover/item:scale-100 ${
                  pathname === child.href
                    ? "bg-navy text-white"
                    : "bg-sky/50 text-navy group-hover/item:bg-navy group-hover/item:text-white"
                }`}
              >
                <Icon name={child.icon} className="size-4" />
              </span>

              <span className="min-w-0">
                <span className="flex items-center gap-2 font-display font-bold text-navy">
                  {child.label}
                  {pathname === child.href && <CurrentDot />}
                </span>
                <span className="mt-0.5 block text-small text-grey">{child.description}</span>
              </span>
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

  /*
   * Where the pill is, and therefore what it means right now.
   *
   * One travelling pill has to say two different things — "you are here" and
   * "you could go here" — so it changes colour depending on which link it has
   * landed on. Navy when it is resting on the current page, a light tint when
   * it has gone visiting a hovered one. Without that the two states are the
   * same white shape and hovering looks identical to being somewhere.
   */
  const pillTarget = hovered ?? activeHref;
  const pillOnActive = pillTarget !== null && pillTarget === activeHref;

  /** What a link's text must be, given where the pill is. */
  const linkTone = (href: string): string => {
    if (href === pillTarget && pillOnActive) return "font-bold text-white";
    // Still the current page, but the pill has moved away to a hovered link —
    // weight alone keeps it identifiable.
    if (href === activeHref) return "font-bold text-navy";
    return "font-semibold text-grey hover:text-navy";
  };

  /**
   * Measures a link and parks the pill on it.
   *
   * Measured with `getBoundingClientRect` on both, and subtracted.
   * `offsetLeft` looks like the obvious choice and is wrong here: it is
   * relative to the nearest *positioned* ancestor, which for a plain link is
   * the capsule but for a dropdown trigger is that dropdown's own `relative`
   * wrapper. So About and Academics reported an offset near zero and the pill
   * shot to the left edge instead of landing on them — which reads as hover
   * simply not working on exactly those two items.
   *
   * Both rects are viewport-relative, so subtracting them cancels the scroll
   * position out and the sticky header stays correct.
   */
  const moveTo = useCallback((href: string | null) => {
    const capsule = capsuleRef.current;
    const item = href === null ? undefined : itemRefs.current.get(href);

    if (!capsule || !item) {
      setIndicator(null);
      return;
    }

    const capsuleRect = capsule.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();

    /*
     * `clientLeft` is the capsule's left border width, and it has to come off.
     *
     * The pill is anchored with `left-0`, which puts its origin at the *padding
     * box* — inside the border. Both rects above are border-box coordinates, so
     * subtracting them alone leaves the border's width baked into the offset
     * and the pill sits a pixel or two right of the link. Combined with the
     * pill previously having no `left` at all — so its base was its static
     * position, already inset by the capsule's padding — the two errors stacked
     * and read as visibly uneven padding, tight on the left and loose on the
     * right.
     */
    setIndicator({
      left: itemRect.left - capsuleRect.left - capsule.clientLeft,
      width: itemRect.width,
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
        between the links instead of two separate highlights blinking.

        It is also the active marker: at rest it sits on the current page, and
        it returns there whenever the pointer leaves. That replaced a separate
        red underline, which meant two competing indicators in one small
        capsule. Bold navy text keeps the current page identifiable during the
        moment the pill is away visiting a hovered link, and `aria-current` is
        what a screen reader gets either way.

        Decorative: `aria-current` on the links is what is actually announced.
      */}
      {indicator && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute bottom-1.5 left-0 top-1.5 z-0 rounded-pill transition-[transform,width,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            pillOnActive ? "bg-navy shadow-card" : "bg-sky/70"
          }`}
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
            tone={linkTone(link.href)}
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
            className={`relative z-10 flex h-10 items-center rounded-pill px-4 text-[0.95rem] transition-[color,transform] duration-200 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 ${linkTone(link.href)}`}
          >
            {link.label}
          </Link>
        ),
      )}
    </div>
  );
}
