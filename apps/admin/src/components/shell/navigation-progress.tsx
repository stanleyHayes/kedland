"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * A thin linear bar across the top of the dashboard while a route is loading.
 *
 * Starts when an in-app link is clicked, completes when the pathname settles.
 * Soft navigations in the App Router do not always remount the shell, so the
 * click listener is what makes the wait visible. Filter forms use the submit
 * button's own pending state instead.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"idle" | "loading" | "finishing">("idle");
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent): void => {
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;
      if (url.pathname === pathnameRef.current) return;

      setPhase("loading");
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, []);

  useEffect(() => {
    const previous = pathnameRef.current;
    pathnameRef.current = pathname;
    if (previous === pathname) return;

    setPhase((current) => (current === "idle" ? current : "finishing"));
  }, [pathname]);

  useEffect(() => {
    if (phase !== "finishing") return;

    const timer = window.setTimeout(() => {
      setPhase("idle");
    }, 280);
    return () => {
      window.clearTimeout(timer);
    };
  }, [phase]);

  if (phase === "idle") return null;

  return (
    <div
      className={`admin-nav-progress ${phase === "finishing" ? "admin-nav-progress-done" : ""}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Loading page"
    />
  );
}
