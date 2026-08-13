"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The Cloudflare Turnstile widget.
 *
 * Rendered only when a site key is configured. Without one the component
 * renders nothing at all and the form submits with no token — which the API
 * accepts, because it only demands a token when *it* has a secret configured.
 * That keeps local development and preview deploys working without anybody
 * having to wire up Cloudflare first.
 *
 * The key arrives as a prop from a Server Component rather than being read
 * from `process.env` here. Next inlines `NEXT_PUBLIC_*` into client bundles by
 * substituting the literal `process.env.NAME`, and this project's TypeScript
 * config (`noPropertyAccessFromIndexSignature`) requires bracket access —
 * which is not reliably substituted. Reading it on the server sidesteps the
 * question entirely instead of depending on a bundler detail.
 *
 * The script is loaded here rather than in the layout so that the ~50 KB only
 * ever reaches the one page with a form on it.
 */

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      size?: "normal" | "compact";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": (code: string) => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
}

/** Turnstile's own width for a normal widget. Below this it does not fit. */
const NORMAL_WIDTH = 300;

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/** Loads the script once, however many times this component mounts. */
let scriptPromise: Promise<void> | undefined;

function loadScript(): Promise<void> {
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => {
      resolve();
    });
    script.addEventListener("error", () => {
      reject(new Error("Turnstile failed to load"));
    });
    document.head.append(script);
  });

  return scriptPromise;
}

export function Turnstile({
  siteKey,
  onToken,
  resetSignal = 0,
}: Readonly<{
  siteKey: string | undefined;
  onToken: (token: string) => void;
  /**
   * Bumped by the form after a failed submit to fetch a fresh token.
   *
   * A Turnstile token is single-use: once the API has verified it, Cloudflare
   * refuses it again. Without this, a parent whose first submit failed for any
   * reason — a dropped connection, a validation error — is retrying with a
   * spent token, so every subsequent attempt fails no matter what they fix.
   */
  resetSignal?: number;
}>) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!siteKey || !container.current) return;

    let widgetId: string | undefined;
    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled || !container.current || !window.turnstile) return;

        /*
         * The compact widget on a narrow phone, the normal one everywhere else.
         *
         * Turnstile's normal widget is a fixed 300px. The form sits inside a
         * padded card inside a padded page, which on a 320px screen leaves it
         * about 216px — so the widget overflowed, the card's `overflow: hidden`
         * clipped the overflow, and the part of the checkbox a thumb needs was
         * outside the visible box. It rendered, it looked present, and it could
         * not be tapped. Desktop had room and worked throughout, which is why
         * this looked like a configuration problem for so long.
         *
         * Measured rather than guessed at a breakpoint: what matters is the
         * space this particular container actually has, which depends on the
         * page's padding as much as the screen's width.
         *
         * The *form* is measured, not this container. Once Turnstile has put a
         * 300px widget inside it, the container reports 300px however little
         * room it really has — it is being stretched past its parent, which is
         * the bug rather than a measurement of it.
         */
        const form = container.current.closest("form");
        const available = (form ?? container.current).getBoundingClientRect().width;

        widgetId = window.turnstile.render(container.current, {
          sitekey: siteKey,
          ...(available > 0 && available < NORMAL_WIDTH ? { size: "compact" as const } : {}),
          callback: onToken,
          // A token expires after five minutes. Someone filling in a long
          // message can easily pass that, so ask for a fresh one rather than
          // letting them submit something the API will reject.
          "expired-callback": () => {
            onToken("");
          },
          /*
           * Cloudflare renders its own error UI into this container when the
           * widget cannot start — most often because the site key is not
           * registered for the hostname, which is exactly what happens when a
           * production key is used on localhost. That UI is unstyled browser
           * default and carries a bare "Troubleshoot" link, so it lands in the
           * middle of the school's contact form looking like a broken page.
           *
           * Hide it. A parent should never be shown Cloudflare's diagnostics;
           * the form still submits, and the API decides what to do about a
           * missing token.
           */
          "error-callback": (code: string) => {
            // eslint-disable-next-line no-console -- the one place this can be diagnosed
            console.warn(`Turnstile could not start (${code}); the widget is hidden.`);
            setFailed(true);
          },
        });
      })
      .catch(() => {
        // Cloudflare being unreachable must not stop a parent contacting the
        // school; the API treats a missing token the same way for the same
        // reason. Nothing to show and nothing to do.
      });

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey, onToken, resetSignal]);

  if (!siteKey) return null;

  // `hidden` rather than unmounting: Cloudflare owns the DOM inside this
  // container, and pulling it out from under the widget mid-render is how you
  // get a "removeChild on a node that is not a child" crash.
  return <div ref={container} className={failed ? "hidden" : "min-h-[65px]"} />;
}
