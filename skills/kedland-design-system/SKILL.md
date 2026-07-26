---
name: kedland-design-system
description: Design and implement Kedland International School public-facing web experiences with a warm, playful, trustworthy visual system. Use for Kedland homepage, landing page, About, Academics, Early Years, Primary, Admissions, News, Student Life, Contact, footer, navigation, cards, forms, heroes, watermarks, imagery, animation, responsive polish, or when adapting another school page to the design taste documented here. Also use when a user asks to redesign freely, match a supplied screenshot or shape, make a page less text-heavy, add route-leading content, improve overly rounded controls, add meaningful watermarks, or verify that a visual change really appears in the browser.
---

# Kedland Design System

Create school experiences that make a child smile and make a parent trust the institution. Preserve Kedland's identity while taking confident freedom with composition, hierarchy, imagery, and interaction.

## Load the right references

- Read [references/visual-language.md](references/visual-language.md) for every visual design or redesign task.
- Read [references/component-recipes.md](references/component-recipes.md) when implementing or reviewing UI components.
- Read [references/taste-translation.md](references/taste-translation.md) when interpreting subjective feedback, screenshots, or broad creative permission.

## Follow this workflow

### 1. Inspect the real surface

- Read repository instructions, the active plan or tracker, and the exact route before editing.
- Inspect shared tokens, fonts, navigation, layout, cards, forms, icons, and CMS/content contracts.
- Locate native logos and approved photography. Never replace available brand assets with improvised marks.
- Check the working tree and preserve unrelated or concurrent changes.
- Run the page before redesigning when practical. Capture desktop and mobile evidence of the current state.

### 2. Establish the page journey

- Identify the page's primary visitor question and one primary action.
- Turn long text into a clear sequence: hook, proof, exploration, reassurance, action.
- Add useful pathways to deeper routes when a landing page feels thin; do not pad it with generic prose.
- Give each page a distinct visual idea tied to its meaning while retaining the shared brand system.
- Rearrange sections freely when the user grants broad latitude. Preserve routes, data contracts, accessibility, and real content.

### 3. Build from shared primitives

- Fix high-leverage tokens and shared components before accumulating page-local exceptions.
- Reuse semantic icons, buttons, fields, cards, image frames, section headings, route guides, and watermark primitives.
- Use pills for buttons, chips, and compact navigation only. Keep inputs and large cards visibly less rounded.
- Use real imagery where it carries trust or identity. If an approved portrait is missing, show an honest placeholder or asset requirement; never present a crest or generated person as the Principal.
- Concentrate motion in one or two memorable moments, usually the hero. Keep the remainder calm and readable.

### 4. Make the composition feel authored

- Combine asymmetry, layered colour bands, swept or organic edges, staggered cards, and controlled overlap.
- Balance playful details with generous whitespace and strong alignment.
- Use meaningful, page-specific watermarks rather than repeating a decorative star everywhere.
- Vary section rhythm and card hierarchy. Avoid making every item an identical white rounded rectangle.
- Keep copy concise, warm, specific, and parent-friendly.

### 5. Verify the rendered result

- Run formatting, linting, type checks, tests, and production build in proportion to the change.
- Inspect the exact requested route in a live browser at desktop and mobile widths.
- Check navigation, focus order, keyboard use, form labels, contrast, image crops, hover/focus states, and reduced motion.
- Compare reference geometry visually when the user says a shape must match exactly. Do not rely on code inspection alone.
- If the user says a design vanished or nothing changed, verify the active server, exact route, rendered shell, caching, and sibling layouts before reporting success.
- Treat build success as necessary evidence, not visual proof.

## Guardrails

- Preserve established Kedland colours unless the user explicitly reopens brand scope.
- Preserve real content sources and CMS integration; use fallbacks only where the product already supports them.
- Do not fabricate pupils, staff, testimonials, statistics, accreditations, or institutional claims.
- Do not let decorative layers reduce readability, responsiveness, or interaction.
- Do not animate essential content in a way that delays access to it.
- Do not use the same layout recipe for every page.

## Completion standard

Deliver a result that is visibly changed, coherent across breakpoints, connected to the rest of the site, and supported by runtime evidence. Summarize the design idea, the important implementation choices, and the checks performed.
