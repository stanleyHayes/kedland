"use client";

import { useMemo, useState } from "react";

import { Field, ICON_NAMES, Icon, TextareaField } from "@kedland/ui";

import { MediaPicker, type MediaPickerOption } from "./media-picker";
import { SectionPreview } from "./section-preview";

import type { FormField } from "@kedland/types/content";
import type { ReactNode } from "react";

import { SubmitButton } from "@/components/ui/pending-button";
import { AdminSelectField } from "@/components/workflows/admin-select-field";

/**
 * A real form for a content section, built from its schema.
 *
 * This replaces a textarea containing the section's raw JSON. That was fine for
 * whoever wrote the schema and unusable for the school office: a missing comma
 * failed validation with a message about a character offset, and nobody should
 * have to know that `trustChips` is an array of exactly four strings before they
 * can fix a typo in one of them.
 *
 * The form still posts a single `data` field containing JSON, which is what the
 * server action already validates against the section's schema. That is
 * deliberate — the contract with the API does not change, so there is exactly one
 * place where content is validated and it is still the schema. This component
 * makes the JSON; it never decides what is acceptable.
 *
 * Layout follows the schema's declaration order, which is the order the fields
 * appear on the page, so someone editing the hero reads down the hero.
 */

/* ── Reading and writing a nested value by path ─────────────────────────── */

type Draft = Record<string, unknown>;

/** `cards.0.title` → the value at that position. */
function valueAt(source: unknown, segments: readonly string[]): unknown {
  return segments.reduce<unknown>((current, segment) => {
    if (current === null || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, source);
}

/**
 * Returns a copy with one path replaced.
 *
 * Copies rather than mutates so React sees a new object and re-renders. Arrays
 * stay arrays — spreading an array into `{...}` would turn it into an object with
 * numeric keys, which passes a shape check and then fails the schema in a way
 * that reads like corrupted data.
 */
function withValueAt(source: unknown, segments: readonly string[], next: unknown): unknown {
  const [head, ...rest] = segments;
  if (head === undefined) return next;

  if (Array.isArray(source)) {
    // `Array.isArray` narrows `unknown` to `any[]`, which would make every read
    // below untyped. Naming it `unknown[]` keeps the rest honest.
    const list = source as unknown[];
    const index = Number(head);
    const copy = [...list];
    copy[index] = withValueAt(list[index], rest, next);
    return copy;
  }

  const object = (source === null || typeof source !== "object" ? {} : source) as Record<string, unknown>;
  return { ...object, [head]: withValueAt(object[head], rest, next) };
}

/** The last segment of a spec path — `cards[].title` → `title`. */
function keyOf(path: string): string {
  return path.split(".").pop()?.replace("[]", "") ?? path;
}

/* ── Controls ───────────────────────────────────────────────────────────── */

interface ControlProps {
  field: FormField;
  /** Concrete path into the draft, with real array indices. */
  segments: string[];
  draft: Draft;
  onChange: (segments: string[], value: unknown) => void;
  /** Unique and stable, for `id`/`htmlFor`. */
  domId: string;
  mediaOptions: MediaPickerOption[];
}

/** How much room is left, once there is little enough to be worth saying. */
function Counter({ used, max }: Readonly<{ used: number; max: number }>) {
  // Silent until three-quarters full: a counter on every field is noise, and
  // noise is what gets ignored when it finally matters.
  if (used < max * 0.75) return null;
  const over = used > max;

  return (
    <span className={`text-[0.72rem] font-semibold ${over ? "text-red-text" : "text-grey"}`}>
      {used} / {max}
      {over ? " — too long for this space" : ""}
    </span>
  );
}

/**
 * How tall a textarea should be.
 *
 * Roughly proportional to how much text the field expects, floored at three rows
 * and capped at fourteen so a 6000-character policy does not push the save button
 * off the bottom of the screen.
 */
function rowsFor(maxLength: number | undefined): number {
  return Math.min(14, Math.max(3, Math.round((maxLength ?? 400) / 110)));
}

function TextControl({ field, segments, draft, onChange, domId }: Readonly<ControlProps>) {
  if (field.kind === "number") return null;
  if (
    field.kind !== "text" &&
    field.kind !== "multiline" &&
    field.kind !== "eyebrow" &&
    field.kind !== "path"
  ) {
    return null;
  }

  const raw = valueAt(draft, segments);
  const text = typeof raw === "string" ? raw : "";
  const max = field.maxLength;

  const shared = {
    id: domId,
    label: field.label,
    required: field.required,
    value: text,
    onChange: (event: { target: { value: string } }) => {
      onChange(segments, event.target.value);
    },
    ...(field.help === undefined ? {} : { hint: field.help }),
    ...(max === undefined ? {} : { maxLength: max }),
  };

  // A path gets the schema's own pattern, so the browser rejects a bad link
  // before the form is sent; an eyebrow is typed in the case it is displayed in.
  const pathExtras = field.kind === "path" ? { pattern: field.pattern, inputMode: "url" as const } : {};
  const eyebrowClass = field.kind === "eyebrow" ? "uppercase tracking-[0.08em]" : "";

  return (
    <div className="grid gap-1">
      {field.kind === "multiline" ? (
        <TextareaField {...shared} rows={rowsFor(max)} />
      ) : (
        <Field {...shared} {...pathExtras} className={eyebrowClass} />
      )}
      {max !== undefined && (
        <span className="justify-self-end">
          <Counter used={text.length} max={max} />
        </span>
      )}
    </div>
  );
}

function NumberControl({ field, segments, draft, onChange, domId }: Readonly<ControlProps>) {
  if (field.kind !== "number") return null;
  const raw = valueAt(draft, segments);

  return (
    <Field
      id={domId}
      label={field.label}
      type="number"
      required={field.required}
      value={typeof raw === "number" ? String(raw) : ""}
      {...(field.min === undefined ? {} : { min: field.min })}
      {...(field.max === undefined ? {} : { max: field.max })}
      {...(field.help === undefined ? {} : { hint: field.help })}
      onChange={(event) => {
        const next = Number(event.target.value);
        onChange(segments, Number.isFinite(next) ? next : "");
      }}
    />
  );
}

/** A picker rather than a text box: the icon set is closed, so typing is only a chance to be wrong. */
function IconControl({ field, segments, draft, onChange, domId }: Readonly<ControlProps>) {
  const raw = valueAt(draft, segments);
  const current = typeof raw === "string" ? raw : "";

  return (
    <div className="grid gap-2">
      <AdminSelectField
        id={domId}
        label={field.label}
        required={field.required}
        value={current}
        options={ICON_NAMES.map((name) => ({ value: name, label: name.replaceAll("-", " ") }))}
        {...(field.help === undefined ? {} : { hint: field.help })}
        onValueChange={(value) => {
          onChange(segments, value);
        }}
      />
      {/* Shows what was actually chosen. A name like "sparkle" is not a picture. */}
      <span className="admin-field-glyph grid size-9 place-items-center justify-self-start text-navy">
        <Icon name={current} className="size-4" />
      </span>
    </div>
  );
}

function ImageControl(props: Readonly<ControlProps>) {
  const { field, segments, draft, onChange, domId, mediaOptions } = props;
  if (field.kind !== "image") return null;

  const mediaSegments = [...segments, "mediaId"];
  const altSegments = [...segments, "alt"];
  const chosen = valueAt(draft, mediaSegments);
  const altField = field.fields.find((f) => keyOf(f.path) === "alt");

  return (
    <fieldset className="admin-panel grid gap-4 rounded-md p-4">
      <legend className="px-1 font-display text-small font-bold text-navy">{field.label}</legend>

      {mediaOptions.length === 0 ? (
        <p className="text-small text-grey">
          No approved images yet — add one in the media library and it will appear here.
        </p>
      ) : (
        <MediaPicker
          id={`${domId}-media`}
          label="Choose an image"
          required={field.required}
          value={typeof chosen === "string" ? chosen : ""}
          options={mediaOptions}
          onValueChange={(value) => {
            onChange(mediaSegments, value);
          }}
        />
      )}

      {altField && <TextControl {...props} field={altField} segments={altSegments} domId={`${domId}-alt`} />}
    </fieldset>
  );
}

/** A button: what it says, and where it goes — side by side, because that is one decision. */
function CtaControl(props: Readonly<ControlProps>) {
  const { field, segments, domId } = props;
  if (field.kind !== "cta") return null;

  return (
    <fieldset className="admin-panel grid gap-4 rounded-md p-4 sm:grid-cols-2">
      <legend className="px-1 font-display text-small font-bold text-navy">{field.label}</legend>
      {field.fields.map((child) => (
        <FieldControl
          key={child.path}
          {...props}
          field={child}
          segments={[...segments, keyOf(child.path)]}
          domId={`${domId}-${keyOf(child.path)}`}
        />
      ))}
    </fieldset>
  );
}

function GroupControl(props: Readonly<ControlProps>) {
  const { field, segments, domId } = props;
  if (field.kind !== "group") return null;

  return (
    <fieldset className="admin-panel grid gap-4 rounded-md p-4">
      <legend className="px-1 font-display text-small font-bold text-navy">{field.label}</legend>
      {field.fields.map((child) => (
        <FieldControl
          key={child.path}
          {...props}
          field={child}
          segments={[...segments, keyOf(child.path)]}
          domId={`${domId}-${keyOf(child.path)}`}
        />
      ))}
    </fieldset>
  );
}

/**
 * The bar above a list, saying how many there are and what the limits are.
 *
 * A fixed-length list says so plainly instead of offering an add button that
 * would fail validation. "Exactly four" is a design constraint, and hiding it
 * until save time is how an editor learns to distrust the form.
 */
function ListHeader({
  label,
  count,
  min,
  max,
  fixed,
  onAdd,
}: Readonly<{
  label: string;
  count: number;
  min?: number;
  max?: number;
  fixed?: number;
  onAdd?: () => void;
}>) {
  const upper = max === undefined ? "any" : String(max);
  const limit = fixed === undefined ? `${String(min ?? 0)}–${upper}` : `exactly ${String(fixed)}`;

  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <p className="font-display font-bold text-navy">
        {label}{" "}
        <span className="font-body text-small font-normal text-grey">
          — {count} of {limit}
        </span>
      </p>
      {onAdd && max !== undefined && count < max && (
        <button type="button" onClick={onAdd} className="admin-quick-action px-3 py-1.5 text-small font-bold">
          Add another
        </button>
      )}
    </div>
  );
}

function RemoveButton({ onClick, disabled }: Readonly<{ onClick: () => void; disabled: boolean }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      // Disabled rather than hidden at the minimum: a control that vanishes
      // leaves someone wondering whether they imagined it.
      title={disabled ? "This section needs at least this many" : "Remove"}
      className="admin-icon-button grid size-8 shrink-0 place-items-center text-navy disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon name="close" className="size-3.5" />
      <span className="sr-only">Remove</span>
    </button>
  );
}

function TextListControl(props: Readonly<ControlProps>) {
  const { field, segments, draft, onChange, domId } = props;
  if (field.kind !== "textList") return null;

  const raw = valueAt(draft, segments);
  // `as unknown[]`: Array.isArray narrows `unknown` to `any[]`, which would make
  // every spread below an unsafe one.
  const items = Array.isArray(raw) ? (raw as unknown[]) : [];
  const atMinimum = items.length <= (field.min ?? 0);

  return (
    <div className="grid gap-3">
      <ListHeader
        label={field.label}
        count={items.length}
        {...(field.min === undefined ? {} : { min: field.min })}
        {...(field.max === undefined ? {} : { max: field.max })}
        {...(field.fixed === undefined ? {} : { fixed: field.fixed })}
        {...(field.fixed === undefined
          ? {
              onAdd: () => {
                onChange(segments, [...items, field.item.blank ?? ""]);
              },
            }
          : {})}
      />
      {field.help && <p className="text-small text-grey">{field.help}</p>}

      <ol className="grid gap-2">
        {items.map((_, index) => (
          // Index as key: these are positional slots, and reordering happens by
          // editing the text rather than by moving rows.
          <li key={index} className="flex items-start gap-2">
            <span className="mt-3.5 w-5 shrink-0 text-right text-small font-bold text-grey">{index + 1}</span>
            <div className="grow">
              <TextControl
                {...props}
                field={{ ...field.item, label: `${field.label} ${String(index + 1)}` }}
                segments={[...segments, String(index)]}
                domId={`${domId}-${String(index)}`}
              />
            </div>
            {field.fixed === undefined && (
              <span className="mt-3">
                <RemoveButton
                  disabled={atMinimum}
                  onClick={() => {
                    onChange(
                      segments,
                      items.filter((__, other) => other !== index),
                    );
                  }}
                />
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * A starting value for one field of a newly added row.
 *
 * Patterned fields carry their own `blank` because their empty string is
 * malformed rather than merely empty — see `FieldMeta` in the types package.
 */
function blankFor(field: FormField): unknown {
  if (field.kind === "number") return field.min ?? 1;
  // Only the text-ish kinds carry `blank`; the union has it nowhere else.
  if (field.kind === "path" || field.kind === "icon" || field.kind === "text") {
    return field.blank ?? "";
  }
  return "";
}

function GroupListControl(props: Readonly<ControlProps>) {
  const { field, segments, draft, onChange, domId } = props;
  if (field.kind !== "groupList") return null;

  const raw = valueAt(draft, segments);
  // As in the text list: Array.isArray narrows `unknown` to `any[]`.
  const items = Array.isArray(raw) ? (raw as unknown[]) : [];
  const atMinimum = items.length <= (field.min ?? 0);

  const blankItem = (): Draft => {
    const item: Draft = {};
    for (const child of field.fields) {
      item[keyOf(child.path)] = blankFor(child);
    }
    return item;
  };

  return (
    <div className="grid gap-3">
      <ListHeader
        label={field.label}
        count={items.length}
        {...(field.min === undefined ? {} : { min: field.min })}
        {...(field.max === undefined ? {} : { max: field.max })}
        {...(field.fixed === undefined ? {} : { fixed: field.fixed })}
        {...(field.fixed === undefined
          ? {
              onAdd: () => {
                onChange(segments, [...items, blankItem()]);
              },
            }
          : {})}
      />
      {field.help && <p className="text-small text-grey">{field.help}</p>}

      <div className="grid gap-3">
        {items.map((_, index) => (
          // Positional, as above.
          <fieldset key={index} className="admin-panel grid gap-4 rounded-md p-4">
            <div className="flex items-center justify-between gap-2">
              <legend className="font-display text-small font-bold text-navy">
                {field.label} {index + 1}
              </legend>
              {field.fixed === undefined && (
                <RemoveButton
                  disabled={atMinimum}
                  onClick={() => {
                    onChange(
                      segments,
                      items.filter((__, other) => other !== index),
                    );
                  }}
                />
              )}
            </div>
            {field.fields.map((child) => (
              <FieldControl
                key={child.path}
                {...props}
                field={child}
                segments={[...segments, String(index), keyOf(child.path)]}
                domId={`${domId}-${String(index)}-${keyOf(child.path)}`}
              />
            ))}
          </fieldset>
        ))}
      </div>
    </div>
  );
}

/** Dispatches to the control a field asked for. */
function FieldControl(props: Readonly<ControlProps>): ReactNode {
  const { kind } = props.field;

  if (kind === "number") return <NumberControl {...props} />;
  if (kind === "icon") return <IconControl {...props} />;
  if (kind === "image") return <ImageControl {...props} />;
  if (kind === "cta") return <CtaControl {...props} />;
  if (kind === "group") return <GroupControl {...props} />;
  if (kind === "textList") return <TextListControl {...props} />;
  if (kind === "groupList") return <GroupListControl {...props} />;

  /*
   * Everything left is text-shaped, and passing `kind` back through is what
   * proves it: `TextControl` only accepts a text-shaped field, so adding a kind
   * to `FormField` without handling it above is a compile error here rather than
   * a new control silently rendering as a plain single-line input.
   */
  return <TextControl {...props} field={{ ...props.field, kind }} />;
}

/* ── The form ───────────────────────────────────────────────────────────── */

export interface SectionFormProps {
  page: string;
  sectionKey: string;
  /** The registry type, which decides how the preview renders it. */
  sectionType: string;
  spec: readonly FormField[];
  /** What is stored now, or a blank value for a section never filled in. */
  value: unknown;
  mediaOptions: MediaPickerOption[];
  action: (formData: FormData) => void | Promise<void>;
  submitClassName: string;
  /** The public site's origin, for the live preview. Absent hides it. */
  siteUrl?: string | undefined;
  admissionFormAvailable?: boolean;
}

export function SectionForm({
  page,
  sectionKey,
  sectionType,
  spec,
  value,
  mediaOptions,
  action,
  submitClassName,
  siteUrl,
  admissionFormAvailable = false,
}: Readonly<SectionFormProps>) {
  const [draft, setDraft] = useState<Draft>(() =>
    value !== null && typeof value === "object" ? { ...(value as Draft) } : {},
  );

  const update = (segments: string[], next: unknown): void => {
    setDraft((current) => withValueAt(current, segments, next) as Draft);
  };

  // The one thing posted. Recomputed rather than kept in a second piece of state,
  // so it cannot fall out of step with what is on screen.
  const serialised = useMemo(() => JSON.stringify(draft), [draft]);

  const controls = (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="page" value={page} />
      <input type="hidden" name="key" value={sectionKey} />
      <input type="hidden" name="data" value={serialised} />

      {spec.map((field) => (
        <FieldControl
          key={field.path}
          field={field}
          segments={[keyOf(field.path)]}
          draft={draft}
          onChange={update}
          domId={`${sectionKey}-${keyOf(field.path)}`}
          mediaOptions={mediaOptions}
        />
      ))}

      <div className="flex items-center gap-3">
        <SubmitButton className={submitClassName}>Save changes</SubmitButton>
        <p className="text-small text-grey">
          Checked against this section&rsquo;s rules before anything is published.
        </p>
      </div>
    </form>
  );

  if (siteUrl === undefined) return <div className="mt-5">{controls}</div>;

  /*
   * Form and preview side by side above `xl`, stacked below it.
   *
   * The preview sticks while the form scrolls, because a long section — the
   * Principal's letter runs to 3000 characters — otherwise scrolls the thing you
   * are watching off the top of the screen while you type into it.
   */
  return (
    <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] xl:items-start">
      {controls}
      <div className="xl:sticky xl:top-4">
        <SectionPreview
          siteUrl={siteUrl}
          sectionKey={sectionKey}
          sectionType={sectionType}
          draft={draft}
          admissionFormAvailable={admissionFormAvailable}
        />
      </div>
    </div>
  );
}
