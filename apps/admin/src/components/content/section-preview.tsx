"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A live preview of the section being edited.
 *
 * The public site renders `/preview` with no chrome, holding its sections in
 * client state, and this posts the draft into it. So the preview is the *real*
 * section components rendering the *real* draft — not an impression of them,
 * which is the only kind of preview worth having. A form full of inputs tells an
 * editor what they are changing; it does not tell them what it will look like.
 *
 * Three things this has to get right:
 *
 *  - **Not on every keystroke.** The draft is posted on a short trailing debounce.
 *    A message per character would re-render the whole section on each one, and
 *    the typing goes gummy long before the preview looks any more live.
 *  - **Not before the frame is listening.** The iframe announces itself when its
 *    listener is attached; a draft posted earlier is silently dropped and the
 *    preview stays blank until the editor happens to type again. So the first
 *    send waits for that.
 *  - **A named target origin.** `postMessage(msg, "*")` would hand the draft to
 *    whatever happens to be in the frame. It is the school's own unpublished
 *    copy, and the frame's source is known, so there is no reason to broadcast.
 */

export interface SectionPreviewProps {
  siteUrl: string;
  sectionKey: string;
  sectionType: string;
  draft: Record<string, unknown>;
  /** Whether the admission PDF is on disk — the one block that needs to know. */
  admissionFormAvailable: boolean;
}

const DEBOUNCE_MS = 250;

/** What the preview is doing, in the three states it can be in. */
function statusLabel(ready: boolean, reachable: boolean): string {
  if (ready) return "Updates as you type";
  return reachable ? "Connecting…" : "Site not reachable";
}

export function SectionPreview({
  siteUrl,
  sectionKey,
  sectionType,
  draft,
  admissionFormAvailable,
}: Readonly<SectionPreviewProps>) {
  const frame = useRef<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);
  const [reachable, setReachable] = useState(true);

  const origin = (() => {
    try {
      return new URL(siteUrl).origin;
    } catch {
      return "";
    }
  })();

  useEffect(() => {
    if (origin === "") return undefined;

    const onMessage = (event: MessageEvent): void => {
      if (event.origin !== origin) return;
      const data: unknown = event.data;
      const kind = data !== null && typeof data === "object" ? (data as { kind?: unknown }).kind : undefined;

      if (kind === "kedland-preview-ready") setReady(true);
    };

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, [origin]);

  /**
   * If the site never answers, say so.
   *
   * An iframe pointing at a site that is not running shows the browser's own
   * error page, which looks like the dashboard is broken. Five seconds is long
   * enough for a cold start and short enough not to leave someone staring.
   */
  useEffect(() => {
    if (ready) return undefined;
    const timer = window.setTimeout(() => {
      setReachable(false);
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [ready]);

  useEffect(() => {
    if (!ready || origin === "") return undefined;

    const timer = window.setTimeout(() => {
      frame.current?.contentWindow?.postMessage(
        {
          kind: "kedland-preview",
          section: { key: sectionKey, type: sectionType, data: draft },
          admissionFormAvailable,
        },
        origin,
      );
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [ready, origin, sectionKey, sectionType, draft, admissionFormAvailable]);

  if (origin === "") {
    return (
      <p className="admin-panel rounded-md p-4 text-small text-grey">
        The public site&rsquo;s address is not configured, so there is nothing to preview against.
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-display text-small font-bold text-navy">Preview</p>
        <p className="text-[0.72rem] text-grey">{statusLabel(ready, reachable)}</p>
      </div>

      <div className="admin-panel overflow-hidden rounded-md">
        <iframe
          ref={frame}
          src={`${origin}/preview`}
          title={`Preview of ${sectionKey}`}
          // Nothing in the preview needs to navigate, submit, or open anything.
          // Scripts are required — it renders React — but that is all it gets.
          sandbox="allow-scripts allow-same-origin"
          loading="lazy"
          className="h-[32rem] w-full border-0 bg-cream"
        />
      </div>

      {!reachable && (
        <p className="text-small text-grey">
          Start the public site to see this. Everything on the left still saves.
        </p>
      )}
    </div>
  );
}
