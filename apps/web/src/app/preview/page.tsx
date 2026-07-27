import { PreviewCanvas } from "./preview-canvas";

import type { Metadata } from "next";

import { resolvePreviewParentOrigin } from "@/lib/preview-origin";

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
export default async function PreviewPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const query = await searchParams;
  const requested = query["parentOrigin"];
  const allowedOrigin = resolvePreviewParentOrigin({
    requested: typeof requested === "string" ? requested : undefined,
    configured: process.env["NEXT_PUBLIC_DASHBOARD_URL"],
    isDev: process.env.NODE_ENV !== "production",
  });

  return (
    <main className="min-h-dvh bg-cream">
      <PreviewCanvas allowedOrigin={allowedOrigin} />
    </main>
  );
}
