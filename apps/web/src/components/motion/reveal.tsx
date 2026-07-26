"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Reveals its children as they are scrolled into view.
 *
 * Uses an IntersectionObserver rather than a scroll listener: the browser does
 * the work off the main thread, so a long page does not fire a handler on every
 * frame of a flick-scroll on a mid-range phone.
 *
 * **It never un-reveals.** Once a section has appeared it stays, and the
 * observer disconnects. Content that fades out again as you scroll back up is
 * the single most irritating version of this effect, and it makes re-reading a
 * paragraph a fight with the page.
 *
 * The hidden state lives in CSS (`.reveal`), not here, so the markup is
 * identical on the server and the client and there is no flash of positioned
 * content on hydration. Without JavaScript the `.no-js` rule shows everything.
 */
export interface RevealProps {
  children: ReactNode;
  /**
   * Milliseconds to hold before revealing, for staggering a row of cards.
   * Kept small — a stagger long enough to notice is a stagger long enough to
   * annoy somebody scrolling past.
   */
  delay?: number;
  className?: string;
}

export function Reveal({ children, delay = 0, className = "" }: Readonly<RevealProps>) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // No observer, no reveal — show it and stop. Without this the section stays
    // at `opacity: 0.001` forever, so a browser missing the API (or a jsdom
    // test) gets an invisible page rather than an unanimated one. Failing open
    // is the only acceptable direction for an effect that hides content.
    if (typeof IntersectionObserver === "undefined") {
      // Next frame rather than synchronously: setting state during an effect
      // makes React render twice before paint for no benefit here, and the
      // content is one frame from visible either way.
      const frame = requestAnimationFrame(() => {
        setVisible(true);
      });
      return () => {
        cancelAnimationFrame(frame);
      };
    }

    // Anything already on screen at load — the hero, most of a short page —
    // is revealed immediately rather than waiting for a scroll that may never
    // come.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          setVisible(true);
          observer.disconnect();
        }
      },
      // A little before the edge, so a section has finished arriving by the
      // time it is properly in view rather than animating under the reader's
      // eyes.
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      data-visible={visible ? "true" : "false"}
      style={delay > 0 ? { transitionDelay: `${String(delay)}ms` } : undefined}
      className={`reveal ${className}`.trim()}
    >
      {children}
    </div>
  );
}
