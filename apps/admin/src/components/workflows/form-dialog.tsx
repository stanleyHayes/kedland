"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

import { Icon } from "@kedland/ui";

import type { ReactNode } from "react";

const DEFAULT_TRIGGER =
  "admin-button admin-button-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 font-display text-small font-bold transition";

const WIDTHS = {
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
  wide: "max-w-7xl",
} as const;

// Hydration flips this once and never again, so there is nothing to subscribe
// to — the same idiom as the public site's theme toggle.
const afterHydration = (): (() => void) => () => undefined;
const onClient = (): boolean => true;
const onServer = (): boolean => false;

/**
 * A consistent home for dashboard forms.
 *
 * Native `<dialog>` supplies modal semantics, Escape handling and focus
 * containment. The page keeps the task summary and its action visible; the
 * detailed fields only enter the layout when an operator asks to work on them.
 */
export function FormDialog({
  title,
  description,
  triggerLabel,
  triggerIcon = "plus",
  triggerClassName = DEFAULT_TRIGGER,
  size = "lg",
  children,
}: Readonly<{
  title: string;
  description?: string | undefined;
  triggerLabel: string;
  triggerIcon?: string;
  triggerClassName?: string;
  size?: keyof typeof WIDTHS;
  children: ReactNode;
}>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [open, setOpen] = useState(false);
  // The trigger stays disabled until hydration so a pre-React click cannot
  // open a dialog whose close handler is not wired yet.
  const hydrated = useSyncExternalStore(afterHydration, onClient, onServer);

  const close = (): void => {
    dialogRef.current?.close();
  };

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={triggerClassName}
        aria-haspopup="dialog"
        disabled={!hydrated}
        onClick={() => {
          dialogRef.current?.showModal();
          setOpen(true);
        }}
      >
        <Icon name={triggerIcon} className="size-4" />
        {triggerLabel}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`admin-form-dialog fixed inset-0 m-auto max-h-[min(88dvh,60rem)] w-[calc(100%_-_2rem)] ${WIDTHS[size]} overflow-hidden rounded-lg p-0`}
        onClose={() => {
          setOpen(false);
        }}
      >
        <div className="admin-form-dialog-shell flex max-h-[min(88dvh,60rem)] flex-col">
          <header className="admin-form-dialog-header flex items-start justify-between gap-5 border-b border-sky/55 px-5 py-4 sm:px-7 sm:py-5">
            <div className="min-w-0">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.13em] text-blue">
                Dashboard action
              </p>
              <h2 id={titleId} className="mt-1 text-h3">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1 max-w-2xl text-small text-grey">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              aria-label={`Close ${title}`}
              onClick={close}
              className="admin-icon-button grid size-10 shrink-0 place-items-center text-navy"
            >
              <Icon name="close" className="size-5" />
            </button>
          </header>
          <div className="admin-form-dialog-body min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
            {children}
          </div>
        </div>
      </dialog>
    </>
  );
}
