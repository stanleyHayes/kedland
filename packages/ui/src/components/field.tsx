import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

/**
 * Form fields.
 *
 * Three rules run through all of this, and they are accessibility
 * requirements rather than preferences:
 *
 *  - **The label is a real `<label>`**, tied to the control by id. A
 *    placeholder is not a label: it vanishes the moment someone types, and a
 *    parent who looks away mid-form has no way to get it back.
 *  - **An error is announced, not just coloured.** The message is tied to the
 *    control with `aria-describedby` and `aria-invalid`, so a screen reader
 *    reads it when focus lands rather than leaving the visitor guessing why
 *    the form will not submit. Colour alone would also fail 1.4.1.
 *  - **Required is marked in text**, not with a bare asterisk, because "*"
 *    read aloud is "star".
 */

const CONTROL = [
  "w-full rounded-[0.625rem] border bg-white px-4 py-3.5 text-ink shadow-[0_1px_0_rgba(20,78,113,0.04)] transition-colors",
  "placeholder:text-grey/70",
  "focus:outline-none focus-visible:ring-3 focus-visible:ring-blue/40",
  "disabled:cursor-not-allowed disabled:bg-cream disabled:opacity-70",
].join(" ");

/** Red border on an invalid control — alongside the message, never instead. */
function borderFor(invalid: boolean): string {
  return invalid ? "border-red focus-visible:border-red" : "border-sky focus-visible:border-blue";
}

/**
 * Room at the right-hand end for whatever sits there.
 *
 * An action (a "show password" button) needs more than a decorative icon
 * because it is a tap target, and it wins when both are somehow present —
 * text running under a button someone can press is worse than text running
 * under an icon they cannot.
 */
function trailingSpace(hasAction: boolean, hasIcon: boolean): string {
  if (hasAction) return "pr-14";
  if (hasIcon) return "pr-12";
  return "";
}

interface FieldShellProps {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  required?: boolean | undefined;
  children: ReactNode;
}

/** Label, control, hint and error — the bit every field type shares. */
function FieldShell({ id, label, error, hint, required = false, children }: Readonly<FieldShellProps>) {
  return (
    <p className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-display font-bold text-navy">
        {label}
        {!required && <span className="ml-1.5 font-body font-normal text-grey">(optional)</span>}
      </label>

      {children}

      {/*
        Below the control, not above it.

        Above, the hint reads as a subtitle to the label and pushes the input
        away from the thing naming it — the eye has to cross a line of grey
        text to get from "Which class?" to the box it belongs to. Below, the
        label sits against its control and the hint reads as what it is: a note
        about what to put in.

        Order here is purely visual. The control points at this with
        `aria-describedby`, so a screen reader reads it as part of the field
        wherever it happens to sit in the DOM.
      */}
      {hint && (
        <span id={`${id}-hint`} className="text-small text-grey">
          {hint}
        </span>
      )}

      {/*
        `role="alert"` so a message appearing after a failed submit is read
        out, rather than silently changing under a visitor who cannot see it.
      */}
      {error && (
        <span id={`${id}-error`} role="alert" className="text-small font-semibold text-red-text">
          {error}
        </span>
      )}
    </p>
  );
}

/** Ties a control to whichever of its hint and error actually exist. */
function describedBy(id: string, hint?: string, error?: string): string | undefined {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  /** An interactive trailing control, such as a password visibility toggle. */
  endAction?: ReactNode;
}

export function Field({
  id,
  label,
  error,
  hint,
  required,
  startIcon,
  endIcon,
  endAction,
  className = "",
  ...input
}: Readonly<FieldProps>) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required}>
      <span className="relative block">
        {startIcon && (
          <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-blue">
            {startIcon}
          </span>
        )}
        <input
          {...input}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={`${CONTROL} ${borderFor(Boolean(error))} ${startIcon ? "pl-12" : ""} ${trailingSpace(
            Boolean(endAction),
            Boolean(endIcon),
          )} ${className}`.trim()}
        />
        {endIcon && (
          <span className="pointer-events-none absolute right-4 top-1/2 z-10 -translate-y-1/2 text-grey">
            {endIcon}
          </span>
        )}
        {endAction && <span className="absolute right-2 top-1/2 z-10 -translate-y-1/2">{endAction}</span>}
      </span>
    </FieldShell>
  );
}

export interface TextareaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  startIcon?: ReactNode;
}

export function TextareaField({
  id,
  label,
  error,
  hint,
  required,
  startIcon,
  rows = 5,
  className = "",
  ...textarea
}: Readonly<TextareaFieldProps>) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required}>
      <span className="relative block">
        {startIcon && (
          <span className="pointer-events-none absolute left-4 top-[1.15rem] z-10 text-blue">
            {startIcon}
          </span>
        )}
        <textarea
          {...textarea}
          id={id}
          rows={rows}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={`${CONTROL} ${borderFor(Boolean(error))} resize-y ${startIcon ? "pl-12" : ""} ${className}`.trim()}
        />
      </span>
    </FieldShell>
  );
}

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  options: { value: string; label: string }[];
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export function SelectField({
  id,
  label,
  error,
  hint,
  required,
  options,
  startIcon,
  endIcon,
  className = "",
  ...select
}: Readonly<SelectFieldProps>) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required}>
      <span className="relative block">
        {startIcon && (
          <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-blue">
            {startIcon}
          </span>
        )}
        <select
          {...select}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={`${CONTROL} ${borderFor(Boolean(error))} appearance-none ${startIcon ? "pl-12" : ""} ${endIcon ? "pr-12" : "pr-11"} ${className}`.trim()}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {endIcon && (
          <span className="pointer-events-none absolute right-4 top-1/2 z-10 -translate-y-1/2 text-grey">
            {endIcon}
          </span>
        )}
      </span>
    </FieldShell>
  );
}
