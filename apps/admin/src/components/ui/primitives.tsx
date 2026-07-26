import Link from "next/link";

import { Icon, IconBadge } from "@kedland/ui";

import { PageGuideControls } from "./page-guide-controls";

import type { ReactNode } from "react";

/**
 * The dashboard's shared primitives.
 *
 * Defined centrally and before any surface needs a second variant, because the
 * alternative is what every admin drifts into: fifteen pages each with its own
 * card, its own heading rhythm and its own idea of what "urgent" looks like.
 *
 * The brand is the public site's, cooled down. Same palette, same fonts, far
 * less roundness (see the radius override in `globals.css`), and colour used to
 * mean something rather than to give a row of cards some variety.
 */

/* ── Page header ────────────────────────────────────────────────────────── */

export interface PageHeaderProps {
  /** Domain context — which part of the dashboard this is. */
  eyebrow: string;
  title: string;
  /** Only when it changes how the page should be used. */
  description?: string;
  /** The section's primary action, kept beside the title rather than adrift. */
  action?: ReactNode;
  /** A short operational guide revealed beside the title. */
  help?: string;
  /** Meaningful page icon. Defaults to the Kedland star. */
  icon?: string;
}

function defaultHelp(title: string, description?: string): string {
  const introduction = description ?? `Use ${title} to manage this part of the workspace.`;
  return `${introduction} Use the primary action to add something new, then use search and filters to narrow the records already here. Open a record to review or change it; destructive actions always ask for confirmation.`;
}

function pageIcon(title: string): string {
  const value = title.toLowerCase();
  if (value.includes("staff") || value.includes("profile")) return "user";
  if (value.includes("audit") || value.includes("security")) return "shield";
  if (value.includes("post") || value.includes("content") || value.includes("categor")) return "book";
  if (value.includes("media") || value.includes("instagram")) return "images";
  if (value.includes("enquir")) return "message";
  if (value.includes("faq") || value.includes("help")) return "sparkle";
  if (value.includes("setting")) return "palette";
  return "star";
}

export function PageHeader({ eyebrow, title, description, action, help, icon }: Readonly<PageHeaderProps>) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-5">
      <div className="min-w-0 max-w-3xl">
        <p className="flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-red-text">
          <span className="h-px w-5 bg-red" />
          {eyebrow}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="admin-page-icon grid size-11 shrink-0 place-items-center rounded-md text-blue">
            <Icon name={icon ?? pageIcon(title)} className="size-5" />
          </span>
          <h1 className="text-balance">{title}</h1>
          <PageGuideControls
            title={title}
            {...(description ? { description } : {})}
            help={help ?? defaultHelp(title, description)}
          />
        </div>
        {description && <p className="mt-2 max-w-2xl text-grey">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function Pagination({
  page,
  totalPages,
  href,
}: Readonly<{ page: number; totalPages: number; href: (page: number) => string }>) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <span className="text-small text-grey">
        Page {String(page)} of {String(totalPages)}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={href(page - 1)}
            className="admin-button admin-button-secondary inline-flex min-h-10 items-center rounded-md px-4 font-display text-small font-bold"
          >
            Previous
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={href(page + 1)}
            className="admin-button admin-button-secondary inline-flex min-h-10 items-center rounded-md px-4 font-display text-small font-bold"
          >
            Next
          </Link>
        )}
      </div>
    </nav>
  );
}

/* ── Panel ──────────────────────────────────────────────────────────────── */

/**
 * A bordered surface.
 *
 * Border first, shadow only where something genuinely floats. A page where
 * every region is a drop-shadowed rectangle has no hierarchy left to spend on
 * the thing that actually needs attention.
 */
export function Panel({
  children,
  className = "",
  flush = false,
}: Readonly<{ children: ReactNode; className?: string; flush?: boolean }>) {
  return <div className={`admin-panel rounded-lg ${flush ? "" : "p-5"} ${className}`.trim()}>{children}</div>;
}

/** A panel's own heading row, with room for a link to the full view. */
export function PanelHeader({
  title,
  action,
  id,
}: Readonly<{ title: string; action?: ReactNode; id?: string }>) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 id={id} className="flex items-center gap-2.5 text-h3">
        <span aria-hidden="true" className="h-5 w-1 rounded-pill bg-blue" />
        {title}
      </h2>
      {action}
    </div>
  );
}

/* ── Status ─────────────────────────────────────────────────────────────── */

/**
 * The status vocabulary, defined once.
 *
 * Five tones, each meaning one thing: healthy, waiting, wrong, in progress,
 * inactive. A red chip must never mean "this is the third card" — if these are
 * ever used for variety they stop carrying information at all.
 */
export type Tone = "healthy" | "attention" | "urgent" | "info" | "neutral";

const CHIP: Record<Tone, string> = {
  healthy: "border-green/30 bg-green/12 text-navy",
  attention: "border-yellow/50 bg-yellow/18 text-ink",
  urgent: "border-red/25 bg-red/[0.07] text-red-text",
  info: "border-blue/30 bg-blue/10 text-navy",
  neutral: "border-sky/70 bg-sky/25 text-navy",
};

const DOT: Record<Tone, string> = {
  healthy: "bg-green",
  attention: "bg-yellow",
  urgent: "bg-red",
  info: "bg-blue",
  neutral: "bg-grey",
};

const VALUE: Record<Tone, string> = {
  healthy: "text-navy",
  attention: "text-ink",
  urgent: "text-red-text",
  info: "text-blue",
  neutral: "text-navy",
};

export function StatusChip({ tone, children }: Readonly<{ tone: Tone; children: ReactNode }>) {
  return (
    <span
      data-tone={tone}
      className={`admin-status-chip inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[0.72rem] font-bold ${CHIP[tone]}`}
    >
      <span aria-hidden="true" className={`size-1.5 rounded-pill ${DOT[tone]}`} />
      {children}
    </span>
  );
}

/* ── Metric ─────────────────────────────────────────────────────────────── */

export interface MetricProps {
  label: string;
  /**
   * `undefined` means the figure could not be read.
   *
   * Rendered as an em dash, never as zero. "0 enquiries" when the API is
   * unreachable tells the office there is nothing waiting, which is the one
   * wrong answer that costs them a parent.
   */
  value: number | undefined;
  /** One short line: what this is compared against, or what it implies. */
  context: string;
  icon: string;
  tone: Tone;
  href: string;
}

export function Metric({ label, value, context, icon, tone, href }: Readonly<MetricProps>) {
  const unavailable = value === undefined;

  return (
    <Link
      href={href}
      data-tone={tone}
      className="admin-metric group relative block min-h-[10.5rem] overflow-hidden rounded-lg p-5"
    >
      {/* A semantic watermark — this metric's own icon, as texture. The same
          device as the public site's cards, which is most of what keeps the two
          feeling like one product. */}
      <Icon
        name={icon}
        strokeWidth={1.25}
        className="pointer-events-none absolute -bottom-6 -right-5 size-28 text-navy opacity-[0.045] transition-transform duration-200 group-hover:-translate-x-1 group-hover:-translate-y-1"
      />

      <div className="relative">
        <p className="flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-grey">
          <span className={`grid size-7 place-items-center rounded-md border ${CHIP[tone]}`}>
            <Icon name={icon} className="size-3.5" />
          </span>
          {label}
        </p>

        <p
          className={`mt-4 font-display text-[2.55rem] font-extrabold leading-none ${
            unavailable ? "text-grey" : VALUE[tone]
          }`}
        >
          {unavailable ? "—" : value}
        </p>

        <p className="mt-2 max-w-[15rem] text-small leading-snug text-grey">
          {unavailable ? "Could not be loaded" : context}
        </p>
      </div>
    </Link>
  );
}

/* ── Decision rows and quick actions ───────────────────────────────────── */

export function AttentionRow({
  icon,
  title,
  body,
  tone,
  href,
  actionLabel,
}: Readonly<{
  icon: string;
  title: string;
  body: string;
  tone: Tone;
  href: string;
  actionLabel: string;
}>) {
  return (
    <Link href={href} className="admin-row-hover group flex items-start gap-3 px-5 py-4 transition-colors">
      <span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-md border ${CHIP[tone]}`}>
        <Icon name={icon} className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display font-bold text-navy">{title}</span>
        <span className="mt-0.5 block text-small leading-snug text-grey">{body}</span>
      </span>
      <span className="mt-1 hidden shrink-0 text-small font-bold text-blue group-hover:underline sm:block">
        {actionLabel} →
      </span>
    </Link>
  );
}

export function QuickAction({
  icon,
  label,
  description,
  href,
}: Readonly<{ icon: string; label: string; description: string; href: string }>) {
  return (
    <Link href={href} className="admin-quick-action group flex items-start gap-3 rounded-md p-3.5">
      <span className="admin-icon-button grid size-9 shrink-0 place-items-center text-navy">
        <Icon name={icon} className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-small font-bold text-navy group-hover:text-blue">
          {label}
        </span>
        <span className="mt-0.5 block text-[0.75rem] leading-snug text-grey">{description}</span>
      </span>
    </Link>
  );
}

/* ── States ─────────────────────────────────────────────────────────────── */

/**
 * Nothing here, and that is fine — or it is a gap. The distinction is the
 * whole point of the component: an empty queue is good news, an unconfigured
 * one is not, and they must not look the same.
 */
export function EmptyState({
  icon = "star",
  title,
  body,
  action,
  compact = false,
}: Readonly<{
  icon?: string;
  title: string;
  body: string;
  action?: ReactNode;
  compact?: boolean;
}>) {
  return (
    <section
      aria-label={title}
      className={`admin-empty-state px-5 text-center ${compact ? "admin-empty-state-compact py-7" : "py-10"}`}
    >
      <IconBadge size={compact ? "size-10" : "size-12"} className="admin-empty-icon mx-auto">
        <Icon name={icon} className="size-5" />
      </IconBadge>
      <p className="mt-3 font-display font-bold text-navy">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-small text-grey">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </section>
  );
}

/**
 * Scoped to the data source that failed, not the page.
 *
 * A dashboard that replaces itself with one error message when a single call
 * fails has thrown away the four sections that were working.
 */
export function DataError({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <output className="flex items-start gap-3 rounded-md border border-red/25 bg-red/[0.055] px-4 py-3.5 text-small text-ink">
      <Icon name="shield" className="mt-0.5 size-4 shrink-0 text-red-text" />
      <span>{children}</span>
    </output>
  );
}
