"use client";

import { useEffect, useState } from "react";

import { canRender, RenderSections } from "@/components/sections/resolve";

/**
 * Renders a draft section, live, for the dashboard's editor.
 *
 * The dashboard embeds this in an iframe beside the form and posts the draft on
 * every keystroke. Nothing is fetched and nothing is saved — the draft arrives by
 * `postMessage` and is rendered by the *real* section components, so what an
 * editor sees is what the page will look like rather than an approximation of it.
 *
 * Why a message rather than a URL or a cookie: a section's draft runs to several
 * kilobytes, which a query string handles badly and would reload the frame on
 * every character; a cookie needs a round trip and a server render per keystroke.
 * A message costs nothing and arrives instantly.
 *
 * **Only the dashboard may talk to it.** `event.origin` is checked against the
 * one configured origin, because an unchecked `message` handler will accept a
 * draft from any page that manages to frame this one. That cannot currently do
 * harm — nothing here is persisted — but a listener that trusts its input is a
 * thing nobody re-examines when the code around it grows.
 */

interface DraftSection {
  key: string;
  type: string;
  data: Record<string, unknown>;
}

/** The one message shape this route understands. */
interface PreviewMessage {
  kind: "kedland-preview";
  section: DraftSection;
  admissionFormAvailable?: boolean;
  /** The dashboard's theme — the frame cannot read the other origin's storage. */
  theme?: "dark" | "light";
}

function isPreviewMessage(value: unknown): value is PreviewMessage {
  if (value === null || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  if (candidate["kind"] !== "kedland-preview") return false;

  const section = candidate["section"];
  if (section === null || typeof section !== "object") return false;
  const { type, data } = section as Record<string, unknown>;

  return typeof type === "string" && data !== null && typeof data === "object";
}

/** The same switch the site's own theme toggle flips. */
function applyTheme(theme: "dark" | "light"): void {
  document.documentElement.dataset["theme"] = theme;
}

export function PreviewCanvas({
  allowedOrigin,
  initialTheme,
}: Readonly<{ allowedOrigin: string; initialTheme?: "dark" | "light" | undefined }>) {
  const [section, setSection] = useState<DraftSection | null>(null);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    // Before the ready announcement, so the dashboard never reveals a frame
    // painted in the wrong theme.
    if (initialTheme) applyTheme(initialTheme);

    const onMessage = (event: MessageEvent): void => {
      // The check that makes this safe to leave in place.
      if (event.origin !== allowedOrigin) return;
      if (!isPreviewMessage(event.data)) return;

      const { theme } = event.data;
      if (theme === "dark" || theme === "light") applyTheme(theme);
      setSection(event.data.section);
      setAvailable(event.data.admissionFormAvailable ?? false);
    };

    window.addEventListener("message", onMessage);

    // Tells the dashboard the frame is listening. Without it the first draft can
    // be posted before this effect runs and is simply lost, leaving the preview
    // blank until the editor happens to type again.
    window.parent.postMessage({ kind: "kedland-preview-ready" }, allowedOrigin);

    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, [allowedOrigin, initialTheme]);

  if (!section) {
    return (
      <p className="px-6 py-16 text-center text-grey">Start typing and this is how the section will look.</p>
    );
  }

  if (!canRender(section.type)) {
    return (
      <p className="px-6 py-16 text-center text-grey">
        There is no preview for a “{section.type}” section yet.
      </p>
    );
  }

  return (
    <RenderSections
      sections={[{ key: section.key, type: section.type, order: 0, data: section.data }]}
      admissionFormAvailable={available}
    />
  );
}
