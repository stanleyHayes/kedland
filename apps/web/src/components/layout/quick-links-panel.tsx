"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { QUICK_LINKS } from "./nav-config";

/**
 * The 3×3 grid-dots control from variant 4 of the reference navbar.
 *
 * It opens the shortcuts a prospective parent actually reaches for — book a
 * tour, the admission form, Instagram — rather than repeating the nav. On
 * narrow screens this same control becomes the menu trigger, which is why it
 * takes an `onRequestMobileMenu` handler.
 */

function GridDotsIcon({ className = "" }: Readonly<{ className?: string }>) {
  const positions = [4, 12, 20];
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      {positions.map((cy) =>
        positions.map((cx) => (
          <circle key={`${String(cx)}-${String(cy)}`} cx={cx} cy={cy} r="2" fill="currentColor" />
        )),
      )}
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="size-3.5 shrink-0 text-grey"
    >
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5 shrink-0 text-grey"
    >
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" />
    </svg>
  );
}

/** External links open in a new tab; the admission form downloads. */
function outboundProps(item: { external?: boolean }): Record<string, unknown> {
  return item.external === true ? { target: "_blank", rel: "noreferrer noopener" } : { download: true };
}

export function QuickLinksPanel({ className = "" }: Readonly<{ className?: string }>) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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
    <div ref={containerRef} className={`relative ${className}`.trim()}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Quick links"
        className="grid size-12 place-items-center rounded-pill text-navy transition-colors hover:bg-sky/40"
      >
        <GridDotsIcon className="size-5" />
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-full z-50 mt-3 w-72 rounded-lg border border-sky bg-white p-2 shadow-lift"
        >
          {QUICK_LINKS.map((item) => {
            const shared =
              "flex items-center justify-between gap-3 rounded-md px-3.5 py-2.5 transition-colors hover:bg-cream";
            const body = (
              <>
                <span className="min-w-0">
                  <span className="block font-display font-bold text-navy">{item.label}</span>
                  <span className="mt-0.5 block text-small text-grey">{item.description}</span>
                </span>
                {item.external === true && <ExternalIcon />}
                {item.download === true && <DownloadIcon />}
              </>
            );

            // External destinations and the PDF are plain anchors: Next's Link
            // is for in-app routes, and `download` needs a real <a>.
            if (item.external === true || item.download === true) {
              return (
                <a
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className={shared}
                  onClick={() => {
                    setOpen(false);
                  }}
                  {...outboundProps(item)}
                >
                  {body}
                </a>
              );
            }

            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={shared}
                onClick={() => {
                  setOpen(false);
                }}
              >
                {body}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { GridDotsIcon };
