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
  "w-full rounded-md border-2 bg-white px-4 py-3 text-ink",
  "placeholder:text-grey/70",
  "focus:outline-none focus-visible:ring-3 focus-visible:ring-blue/40",
  "disabled:cursor-not-allowed disabled:bg-cream disabled:opacity-70",
].join(" ");

/** Red border on an invalid control — alongside the message, never instead. */
function borderFor(invalid: boolean): string {
  return invalid ? "border-red focus-visible:border-red" : "border-sky focus-visible:border-blue";
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

      {hint && (
        <span id={`${id}-hint`} className="text-small text-grey">
          {hint}
        </span>
      )}

      {children}

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
}

export function Field({ id, label, error, hint, required, ...input }: Readonly<FieldProps>) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required}>
      <input
        {...input}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${CONTROL} ${borderFor(Boolean(error))}`}
      />
    </FieldShell>
  );
}

export interface TextareaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
}

export function TextareaField({
  id,
  label,
  error,
  hint,
  required,
  rows = 5,
  ...textarea
}: Readonly<TextareaFieldProps>) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required}>
      <textarea
        {...textarea}
        id={id}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${CONTROL} ${borderFor(Boolean(error))} resize-y`}
      />
    </FieldShell>
  );
}

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  options: { value: string; label: string }[];
}

export function SelectField({
  id,
  label,
  error,
  hint,
  required,
  options,
  ...select
}: Readonly<SelectFieldProps>) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required}>
      <select
        {...select}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${CONTROL} ${borderFor(Boolean(error))} appearance-none bg-[length:1rem] bg-[right_1rem_center] bg-no-repeat pr-11`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
