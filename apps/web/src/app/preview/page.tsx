import { PreviewCanvas } from "./preview-canvas";

import type { Metadata } from "next";

/**
 * The dashboard's live preview surface.
 *
 * Deliberately outside the site's route group: no header, no footer, no page
 * transition. An editor working on the hero is previewing the hero, and framing
 * it inside the whole chrome would give them a small window onto a large page and
 * make them hunt for the thing they just typed.
 *
 * It renders nothing of its own — see `PreviewCanvas` for how a draft arrives.
 */

export const metadata: Metadata = {
  title: "Preview",
  // Belt and braces alongside the header set in next.config.ts. This page has no
  // content of its own and must never appear in a search result.
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Only this origin may post drafts in, and it is read on the server so the
 * allowed origin is not something the framing page gets to choose.
 *
 * Falls back to same-origin, which in practice means the preview stays blank
 * rather than accepting drafts from anywhere — the safe direction for a default.
 */
function dashboardOrigin(): string {
  const configured = process.env["NEXT_PUBLIC_DASHBOARD_URL"];
  if (!configured) return "null";

  try {
    return new URL(configured).origin;
  } catch {
    return "null";
  }
}

export default function PreviewPage() {
  return (
    <main className="min-h-dvh bg-cream">
      <PreviewCanvas allowedOrigin={dashboardOrigin()} />
    </main>
  );
}
