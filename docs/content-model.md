# Content model

The dashboard lets the school edit page copy. It does not let anyone rebuild a page. This document
explains the mechanism that draws that line.

## The registry

[`packages/types/src/content/registry.ts`](../packages/types/src/content/registry.ts) declares, in
code:

- which pages exist (`PAGE_KEYS`)
- which sections each page has, **in order**
- which schema validates each section's values

MongoDB stores only `data` for each `(page, key)` pair. It cannot introduce a section, remove one, or
move one — the registry is not writable at runtime.

## What an editor can and cannot change

| Editable                      | Locked                            |
| ----------------------------- | --------------------------------- |
| Headings, body copy, labels   | Which sections exist              |
| Card and tile contents        | Section order                     |
| Images and their alt text     | Layout and component internals    |
| CTA labels and internal links | Brand tokens, typography, spacing |
| SEO title and description     | Routes                            |

## Why fixed-length arrays

`trustChips` is `.length(4)` because they sit in one row. `tiles` is `.length(7)` because the school's
name has seven letters and the KEDLAND reveal collapses otherwise. These are not arbitrary — each
one encodes a layout fact that a well-meaning edit would otherwise break.

## Adding a section

1. Add the value schema to `sections.ts` (or reuse one).
2. Add the slot to the page's `sections` array in `registry.ts`, with a `label` and a `hint` — the
   dashboard renders both.
3. Add the matching React component to `apps/web/src/components/sections/`.
4. Add its seed data.
5. Ship it. The dashboard form is generated from the registry, so there is nothing to wire by hand.

## Why the form cannot disagree with the validator

The dashboard generates its form from the registry entry, and the API validates against the same
entry. There is no second definition to drift from.
