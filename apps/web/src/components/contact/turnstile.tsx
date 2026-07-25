"use client";

import { useEffect, useRef } from "react";

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
    options: { sitekey: string; callback: (token: string) => void; "expired-callback": () => void },
  ) => string;
  remove: (widgetId: string) => void;
}

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
}: Readonly<{ siteKey: string | undefined; onToken: (token: string) => void }>) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!siteKey || !container.current) return;

    let widgetId: string | undefined;
    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled || !container.current || !window.turnstile) return;

        widgetId = window.turnstile.render(container.current, {
          sitekey: siteKey,
          callback: onToken,
          // A token expires after five minutes. Someone filling in a long
          // message can easily pass that, so ask for a fresh one rather than
          // letting them submit something the API will reject.
          "expired-callback": () => {
            onToken("");
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
  }, [siteKey, onToken]);

  if (!siteKey) return null;

  return <div ref={container} className="min-h-[65px]" />;
}
