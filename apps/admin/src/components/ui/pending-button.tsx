"use client";

import { useFormStatus } from "react-dom";

import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Three animated dots for in-button pending states.
 *
 * Kept small and inline so a toolbar or dialog action does not jump when a
 * server action starts. Page-level loading still uses skeletons; this is only
 * for the control the operator just pressed.
 */
export function PendingDots({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <span className={`admin-pending-dots ${className}`.trim()} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

export function PendingContent({
  pending,
  label,
  pendingLabel,
}: Readonly<{
  pending: boolean;
  label: ReactNode;
  pendingLabel?: ReactNode;
}>) {
  if (!pending) return <>{label}</>;

  return (
    <span className="inline-flex items-center justify-center gap-2">
      <span>{pendingLabel ?? label}</span>
      <PendingDots />
    </span>
  );
}

type SubmitButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  /** Shown while the surrounding form's server action is in flight. */
  pendingLabel?: ReactNode;
};

/**
 * A submit control that reflects the form's pending state.
 *
 * Must render inside the `<form>` it describes — `useFormStatus` only sees its
 * nearest parent form. Disables itself while pending so a double-click cannot
 * create two accounts, publish twice, or send two invitations.
 */
export function SubmitButton({
  children,
  pendingLabel,
  className = "",
  disabled,
  ...rest
}: Readonly<SubmitButtonProps>) {
  const { pending } = useFormStatus();
  const isDisabled = Boolean(disabled) || pending;

  return (
    <button
      type="submit"
      className={className}
      disabled={isDisabled}
      aria-busy={pending || undefined}
      {...rest}
    >
      <PendingContent pending={pending} label={children} pendingLabel={pendingLabel} />
    </button>
  );
}
