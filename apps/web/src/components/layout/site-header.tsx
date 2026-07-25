"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ArrowChip, buttonClasses } from "@kedland/ui";

import { LogoLockup } from "./logo-lockup";
import { MobileMenu } from "./mobile-menu";
import { NavCapsule } from "./nav-capsule";
import { NAV_CTA, NAV_LINKS } from "./nav-config";
import { GridDotsIcon, QuickLinksPanel } from "./quick-links-panel";

/**
 * The global header — variant 4 of the supplied navbar reference, in Kedland's
 * palette (build package §2.6).
 *
 * Left: the wave-backed logo lockup. Centre: the nav capsule. Right: the
 * gradient "Enrol Now" pill with its arrow chip, and the grid-dots control —
 * which opens quick links on desktop and the full-screen menu on mobile.
 *
 * The bar is inset from the viewport edge and floats on a rounded card, as in
 * the reference; it shrinks slightly once the page scrolls so it takes less
 * room while reading.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = (): void => {
      setScrolled(window.scrollY > 80);
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    // The browser may restore a scroll position on a back-navigation, so read
    // once after mount — on the next frame rather than synchronously, which
    // would set state during the effect and cascade a second render.
    const frame = requestAnimationFrame(onScroll);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-90 px-3 pt-3 sm:px-5 sm:pt-4">
        <div
          data-testid="header-bar"
          className={`mx-auto flex max-w-7xl items-center gap-3 rounded-lg bg-white/92 pr-2 shadow-card backdrop-blur-md transition-[padding,box-shadow] duration-200 motion-reduce:transition-none ${
            scrolled ? "py-1 shadow-lift" : "py-2"
          }`}
        >
          <LogoLockup />

          <nav aria-label="Primary" className="mx-auto hidden lg:block">
            <NavCapsule links={NAV_LINKS} pathname={pathname} />
          </nav>

          <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
            <Link
              href={NAV_CTA.href}
              className={buttonClasses({ size: "sm", className: "hidden pr-2 sm:inline-flex" })}
            >
              {NAV_CTA.label}
              <ArrowChip />
            </Link>

            {/* Desktop: shortcuts. Mobile: the menu trigger. One control, two
                jobs — exactly as the reference lays it out. */}
            <QuickLinksPanel className="hidden lg:block" />

            <button
              type="button"
              onClick={() => {
                setMenuOpen(true);
              }}
              aria-expanded={menuOpen}
              aria-haspopup="dialog"
              aria-label="Open menu"
              className="grid size-12 place-items-center rounded-pill text-navy transition-colors hover:bg-sky/40 lg:hidden"
            >
              <GridDotsIcon className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={() => {
          setMenuOpen(false);
        }}
        pathname={pathname}
      />
    </>
  );
}
