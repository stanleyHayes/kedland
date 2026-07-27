"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ArrowChip, buttonClasses } from "@kedland/ui";

import { LogoLockup } from "./logo-lockup";
import { MobileMenu } from "./mobile-menu";
import { NavCapsule } from "./nav-capsule";
import { NAV_CTA, NAV_LINKS } from "./nav-config";
import { GridDotsIcon, QuickLinksPanel } from "./quick-links-panel";
import { ThemeToggle } from "./theme-toggle";

/**
 * The global header — variant 4 of the supplied navbar reference, in Kedland's
 * palette (build package §2.6).
 *
 * Left: the wave-backed logo lockup. Centre: the nav capsule. Right: the
 * gradient "Enrol Now" pill with its arrow chip, and the grid-dots control —
 * which opens quick links on desktop and the full-screen menu on mobile.
 *
 * At the top of a page the navigation settles into the layout as a regular,
 * full-width bar. Once the reader moves down the page it contracts into the
 * inset floating capsule from the reference, then expands back into place when
 * they return to the top.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollFrame = useRef<number | null>(null);

  useEffect(() => {
    const updateHeader = (): void => {
      scrollFrame.current = null;
      setScrolled(window.scrollY > 48);
    };

    const onScroll = (): void => {
      if (scrollFrame.current !== null) return;
      scrollFrame.current = requestAnimationFrame(updateHeader);
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    // The browser may restore a scroll position on a back-navigation, so read
    // once after mount — on the next frame rather than synchronously, which
    // would set state during the effect and cascade a second render.
    onScroll();

    return () => {
      if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <header
        data-header-state={scrolled ? "floating" : "settled"}
        className={`sticky top-0 z-90 transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          scrolled ? "px-3 pt-3 sm:px-5 sm:pt-4" : "px-0 pt-0"
        }`}
      >
        <div
          data-testid="header-bar"
          /*
            `px-2`, not `pr-2`.
            
            The bar had padding on the right only, so the swept plaque — which is
            absolutely positioned at the lockup's left edge — ran right up against
            the pill's boundary and kissed it at mid-height, while having clear
            white above and below it. Everything inside a pill should stand off
            its edge; the plaque was the one thing that did not. 8px here reads as
            the same gap as the 9px the plaque already has top and bottom.
          */
          className={`mx-auto flex items-center gap-3 backdrop-blur-md transition-[max-width,border-radius,padding,box-shadow,background-color,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            scrolled
              ? "max-w-7xl rounded-lg border border-transparent bg-white/92 px-2 py-1 shadow-lift"
              : "max-w-[100vw] rounded-none border-b border-sky/70 bg-white/96 px-4 py-2.5 shadow-[0_1px_0_rgba(28,108,151,0.08)] sm:px-6"
          }`}
        >
          <LogoLockup />

          <nav aria-label="Primary" className="mx-auto hidden lg:block">
            <NavCapsule links={NAV_LINKS} pathname={pathname} />
          </nav>

          <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
            <Link
              href={NAV_CTA.href}
              className={buttonClasses({
                size: "sm",
                className: "hidden pr-2 max-sm:!hidden sm:inline-flex",
              })}
            >
              {NAV_CTA.label}
              <ArrowChip />
            </Link>

            {/* Keep the site-wide theme control in the header at every width.
                Mobile visitors should not have to open navigation to change
                how the whole site is displayed. */}
            <ThemeToggle />

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
              className="neu-icon neu-interactive grid size-12 place-items-center rounded-pill text-navy lg:hidden"
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
