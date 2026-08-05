import { Icon } from "@kedland/ui";

import type { ReactNode } from "react";

import { DataError, Panel, StatusChip } from "@/components/ui/primitives";

export const PRIMARY_BUTTON =
  "admin-button admin-button-primary inline-flex min-h-11 items-center justify-center rounded-md px-4 font-display text-small font-bold transition";
export const SECONDARY_BUTTON =
  "admin-button admin-button-secondary inline-flex min-h-10 items-center justify-center rounded-md px-3.5 font-display text-small font-bold transition";
export const DANGER_BUTTON =
  "admin-button admin-button-danger inline-flex min-h-10 items-center justify-center rounded-md px-3.5 font-display text-small font-bold transition";

export { PendingContent, PendingDots, SubmitButton } from "@/components/ui/pending-button";

export function Feedback({
  notice,
  error,
}: Readonly<{ notice?: string | undefined; error?: string | undefined }>) {
  if (error) return <DataError>{error}</DataError>;
  if (!notice) return null;

  return (
    <output className="flex items-start gap-3 rounded-md border border-green/30 bg-green/[0.08] px-4 py-3.5 text-small text-ink">
      <Icon name="star" className="mt-0.5 size-4 shrink-0 text-green" />
      <span>{notice}</span>
    </output>
  );
}

export function WorkflowError({ message }: Readonly<{ message: string }>) {
  return (
    <Panel>
      <DataError>{message}</DataError>
    </Panel>
  );
}

export function TableShell({ children, label }: Readonly<{ children: ReactNode; label: string }>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[44rem] border-collapse text-left text-small" aria-label={label}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <thead className="border-b border-sky/70 bg-sky/[0.13] text-[0.68rem] uppercase tracking-[0.1em] text-grey">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({
  children,
  align = "left",
}: Readonly<{ children: ReactNode; align?: "left" | "right" }>) {
  return <th className={`px-4 py-3 font-bold ${align === "right" ? "text-right" : ""}`}>{children}</th>;
}

export function Td({ children, className = "" }: Readonly<{ children: ReactNode; className?: string }>) {
  return <td className={`border-b border-sky/45 px-4 py-3.5 align-top ${className}`}>{children}</td>;
}

export function BooleanStatus({ value, yes, no }: Readonly<{ value: boolean; yes: string; no: string }>) {
  return <StatusChip tone={value ? "healthy" : "attention"}>{value ? yes : no}</StatusChip>;
}

export function formatDate(value: string | null): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Accra",
  }).format(date);
}
