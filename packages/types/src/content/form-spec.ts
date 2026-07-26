import { fieldCopy } from "./form-copy";
import { SECTION_SCHEMAS, type SectionType } from "./sections";

import type { ZodType } from "zod";

/**
 * Turns a section schema into a description of the form that edits it.
 *
 * This exists because the dashboard used to show an editor the section's raw
 * JSON in a textarea. That is fine for a developer and unusable for the school
 * office: a missing brace silently fails validation, and nobody should have to
 * know that `trustChips` is an array of exactly four strings.
 *
 * Deriving the form from the schema rather than hand-writing 24 of them means the
 * two cannot drift. Add a field to a section and the form grows a control; change
 * a maximum and the counter follows. The alternative — a form per section — would
 * be correct on the day it was written and wrong within a month.
 *
 * **This is the only file that reads Zod's internals.** `def.type`, `def.shape`,
 * `def.element`, `def.checks` and `def.innerType` are documented but not
 * guaranteed stable across majors, so they are touched here and nowhere else, and
 * `form-spec.spec.ts` asserts the whole registry still resolves. A Zod upgrade
 * that changes them breaks one file with a clear test, rather than 24 forms.
 */

/* ── The shape a renderer consumes ──────────────────────────────────────── */

interface BaseField {
  /** Dotted, with `[]` for a repeated group: `cards[].title`. */
  path: string;
  label: string;
  help?: string;
  required: boolean;
}

export interface TextField extends BaseField {
  kind: "text" | "multiline" | "eyebrow" | "path" | "icon";
  maxLength?: number;
  /** Source of a `pattern` attribute on the input. */
  pattern?: string;
  /** A value satisfying `pattern`, used to seed a never-filled section. */
  blank?: string;
}

export interface NumberField extends BaseField {
  kind: "number";
  min?: number;
  max?: number;
}

/** A `{ label, href }` button or a `{ mediaId, alt }` image — rendered as a unit. */
export interface CompositeField extends BaseField {
  kind: "cta" | "image";
  fields: FormField[];
}

/** Any other nested object. Rendered as a titled fieldset. */
export interface GroupField extends BaseField {
  kind: "group";
  fields: FormField[];
}

/** A list of plain strings — the reassurance badges, the activity chips. */
export interface TextListField extends BaseField {
  kind: "textList";
  item: TextField;
  min?: number;
  max?: number;
  /** Set when the count is fixed, so the renderer offers no add or remove. */
  fixed?: number;
}

/** A list of repeated groups — cards, steps, year groups. */
export interface GroupListField extends BaseField {
  kind: "groupList";
  fields: FormField[];
  min?: number;
  max?: number;
  fixed?: number;
}

export type FormField =
  TextField | NumberField | CompositeField | GroupField | TextListField | GroupListField;

/* ── Reading Zod ────────────────────────────────────────────────────────── */

interface ZodInternals {
  def: {
    type: string;
    shape?: Record<string, unknown>;
    element?: unknown;
    innerType?: unknown;
    checks?: { _zod?: { def?: CheckDef }; def?: CheckDef }[];
  };
  shape?: Record<string, unknown>;
  maxLength?: number | null;
  minValue?: number | null;
  maxValue?: number | null;
  meta?: () => { control?: string; group?: string; blank?: string } | undefined;
}

interface CheckDef {
  check?: string;
  minimum?: number;
  maximum?: number;
  length?: number;
  pattern?: RegExp;
}

const internals = (schema: unknown): ZodInternals => schema as ZodInternals;

/** Strips `.optional()` / `.nullable()` wrappers, reporting whether it found one. */
function unwrap(schema: unknown): { schema: unknown; required: boolean } {
  let current = schema;
  let required = true;

  for (;;) {
    const type = internals(current).def.type;
    if (type !== "optional" && type !== "nullable" && type !== "default") break;
    if (type !== "default") required = false;
    current = internals(current).def.innerType;
  }

  return { schema: current, required };
}

function checksOf(schema: unknown): CheckDef[] {
  return (internals(schema).def.checks ?? []).map((c) => c._zod?.def ?? c.def ?? {});
}

function arrayBounds(schema: unknown): { min?: number; max?: number; fixed?: number } {
  const bounds: { min?: number; max?: number; fixed?: number } = {};

  for (const check of checksOf(schema)) {
    if (check.check === "length_equals" && check.length !== undefined) {
      bounds.fixed = check.length;
      bounds.min = check.length;
      bounds.max = check.length;
    }
    if (check.check === "min_length" && check.minimum !== undefined) bounds.min = check.minimum;
    if (check.check === "max_length" && check.maximum !== undefined) bounds.max = check.maximum;
  }

  return bounds;
}

/** The `regex()` source and the message the schema was given for it. */
function patternOf(schema: unknown): { pattern?: string; patternHint?: string } {
  const check = checksOf(schema).find((c) => c.pattern !== undefined);
  if (!check?.pattern) return {};

  return { pattern: check.pattern.source };
}

/** A bound worth putting on a control, or nothing. */
function finite(value: number | null | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/* ── Derivation ─────────────────────────────────────────────────────────── */

const CONTROLS = new Set(["text", "multiline", "eyebrow", "path", "icon"]);

/**
 * The fallback when a string carries no `control` meta.
 *
 * Only reachable for a string declared inline in a section schema rather than
 * through a primitive from `fields.ts`. Long strings become textareas because
 * that is the safer error: a paragraph in a single-line input is unusable, while
 * a heading in a two-row textarea is merely unnecessary.
 */
const MULTILINE_FROM = 160;

function textFieldFor(
  schema: unknown,
  path: string,
  label: string,
  help: string | undefined,
  required: boolean,
): TextField {
  const meta = internals(schema).meta?.();
  const declared = meta?.control;
  const maxLength = internals(schema).maxLength ?? undefined;

  let kind: TextField["kind"] = (maxLength ?? 0) >= MULTILINE_FROM ? "multiline" : "text";
  if (declared !== undefined && CONTROLS.has(declared)) {
    kind = declared as TextField["kind"];
  }

  return {
    kind,
    path,
    label,
    ...(help === undefined ? {} : { help }),
    required,
    ...(maxLength === undefined ? {} : { maxLength }),
    ...patternOf(schema),
    ...(meta?.blank === undefined ? {} : { blank: meta.blank }),
  };
}

// eslint-disable-next-line sonarjs/cognitive-complexity -- this is the single, audited boundary that maps Zod's node variants to form controls.
function fieldFor(rawSchema: unknown, path: string, sectionType: string): FormField {
  const { schema, required } = unwrap(rawSchema);
  const { label, help } = fieldCopy(sectionType, path);
  const type = internals(schema).def.type;
  const group = internals(schema).meta?.()?.group;

  if (type === "object") {
    const shape = internals(schema).shape ?? internals(schema).def.shape ?? {};
    const fields = Object.entries(shape).map(([key, value]) =>
      fieldFor(value, path === "" ? key : `${path}.${key}`, sectionType),
    );

    // `cta` and `image` are laid out as one unit rather than a generic fieldset:
    // a button is a label and where it goes, side by side, and an image is a
    // picker with its description underneath.
    if (group === "cta" || group === "image") {
      return { kind: group, path, label, ...(help === undefined ? {} : { help }), required, fields };
    }
    return { kind: "group", path, label, ...(help === undefined ? {} : { help }), required, fields };
  }

  if (type === "array") {
    const element = internals(schema).def.element;
    const bounds = arrayBounds(schema);
    const { schema: item } = unwrap(element);
    const itemType = internals(item).def.type;

    if (itemType === "object") {
      const shape = internals(item).shape ?? internals(item).def.shape ?? {};
      return {
        kind: "groupList",
        path,
        label,
        ...(help === undefined ? {} : { help }),
        required,
        fields: Object.entries(shape).map(([key, value]) => fieldFor(value, `${path}[].${key}`, sectionType)),
        ...bounds,
      };
    }

    return {
      kind: "textList",
      path,
      label,
      ...(help === undefined ? {} : { help }),
      required,
      item: textFieldFor(item, `${path}[]`, label, undefined, true),
      ...bounds,
    };
  }

  if (type === "number") {
    // An unbounded `z.number()` reports ±Infinity rather than null, and putting
    // that on the control gives `<input type="number" min="-Infinity">` — not a
    // valid attribute value, so the browser ignores it. Only a finite bound is a
    // bound.
    const min = finite(internals(schema).minValue);
    const max = finite(internals(schema).maxValue);

    return {
      kind: "number",
      path,
      label,
      ...(help === undefined ? {} : { help }),
      required,
      ...(min === undefined ? {} : { min }),
      ...(max === undefined ? {} : { max }),
    };
  }

  return textFieldFor(schema, path, label, help, required);
}

/**
 * The form for one section type.
 *
 * Returns top-level fields in the schema's own declaration order, which is the
 * order they appear on the page — so the form reads down the section the editor
 * is looking at.
 */
export function toFormSpec(sectionType: SectionType): FormField[] {
  return toFormSpecFor(SECTION_SCHEMAS[sectionType], sectionType);
}

/**
 * The same derivation for any object schema, not only a registered section.
 *
 * Settings and SEO overrides are validated by schemas built from the same
 * primitives, and a form for them should come from the same place rather than
 * from a second implementation that drifts. `label` is the key the copy map is
 * scoped by, so passing a section type gives that section's overrides.
 */
export function toFormSpecFor(schema: unknown, label: string): FormField[] {
  const shape = internals(schema).shape ?? internals(schema).def.shape ?? {};

  return Object.entries(shape).map(([key, value]) => fieldFor(value, key, label));
}

/** Every field in a spec, flattened. For tests and for validation walks. */
export function flattenFields(fields: readonly FormField[]): FormField[] {
  return fields.flatMap((field) => {
    if (field.kind === "group" || field.kind === "cta" || field.kind === "image") {
      return [field, ...flattenFields(field.fields)];
    }
    if (field.kind === "groupList") return [field, ...flattenFields(field.fields)];
    if (field.kind === "textList") return [field, field.item];
    return [field];
  });
}

/**
 * A blank value matching a spec, for a section with nothing stored yet.
 *
 * Lists start at their minimum length rather than empty: a four-up card grid
 * whose form opens with no cards gives an editor nothing to type into and a
 * validation error the moment they save.
 */
export function emptyValueFor(fields: readonly FormField[]): Record<string, unknown> {
  const value: Record<string, unknown> = {};

  for (const field of fields) {
    const key = field.path.split(".").pop() ?? field.path;

    switch (field.kind) {
      case "group":
      case "cta":
      case "image":
        value[key] = emptyValueFor(field.fields);
        break;
      case "textList":
        value[key] = Array.from({ length: field.min ?? 1 }, () => "");
        break;
      case "groupList":
        value[key] = Array.from({ length: field.min ?? 1 }, () => emptyValueFor(field.fields));
        break;
      case "number":
        value[key] = field.min ?? 1;
        break;
      /*
       * `blank` rather than "". A patterned field's empty string is not merely
       * empty but *malformed*, so an editor opening a never-filled section met
       * "Must be an internal path such as /admissions" against a control they had
       * not touched — an error about a rule instead of an instruction. The schema
       * declares its own safe blank; see `FieldMeta`.
       */
      case "text":
      case "multiline":
      case "eyebrow":
      case "path":
      case "icon":
        value[key] = field.blank ?? "";
        break;
      default: {
        const exhaustiveField: never = field;
        throw new Error(`Unsupported form field: ${JSON.stringify(exhaustiveField)}`);
      }
    }
  }

  return value;
}

/** Re-exported so a caller needs one import to build and validate a form. */
export { SECTION_SCHEMAS, type SectionType };
export type SectionSchema = (typeof SECTION_SCHEMAS)[SectionType];
export const sectionSchemaFor = (type: SectionType): ZodType => SECTION_SCHEMAS[type];
