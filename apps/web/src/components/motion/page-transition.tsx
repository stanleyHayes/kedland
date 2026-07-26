"use client";

import { usePathname } from "next/navigation";

import type { ReactNode } from "react";

/**
 * Settles each page in on navigation.
 *
 * The whole mechanism is the `key`: changing it on every route makes React
 * replace the subtree, which replays the CSS entry animation. No transition
 * library, no state machine, and nothing to unwind if a navigation is
 * cancelled halfway.
 *
 * It is an *entry* animation only — there is no exit. Animating the old page
 * out means holding the new one back until the exit finishes, which adds real
 * latency to every click in exchange for a flourish most visitors never
 * consciously see. The page a parent asked for should appear as fast as it can
 * and simply arrive gracefully.
 *
 * The animation is pure CSS, so it plays from the server-rendered HTML too, and
 * `prefers-reduced-motion` switches it off entirely.
 */
export function PageTransition({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
