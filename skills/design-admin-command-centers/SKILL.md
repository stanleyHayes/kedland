---
name: design-admin-command-centers
description: Audit, design, redesign, or implement branded admin dashboards and operator consoles that prioritize real decisions, queues, trustworthy data, role-aware navigation, responsive workflows, and polished shared UI. Use for admin shells, sidebars, top bars, overview pages, KPI cards, charts, tables, moderation or verification queues, audit logs, settings, empty/loading/error states, light/dark themes, mobile drawers, command centers, and dashboard visual polish. Also use when an admin feels generic, cluttered, too rounded, too chart-heavy, visually disconnected from the product, misleading during API failure, or poorly matched to the number and type of operators.
---

# Design Admin Command Centers

Design an operating environment, not a gallery of statistics. Make the current state legible, expose what requires attention, and shorten the path from signal to safe action.

## Load the relevant references

- Read [references/system-principles.md](references/system-principles.md) for every audit or redesign.
- Read [references/shell-navigation.md](references/shell-navigation.md) when changing layout, sidebar, top bar, mobile navigation, themes, or account controls.
- Read [references/data-workflows.md](references/data-workflows.md) when changing overview pages, metrics, charts, tables, queues, detail views, or operational states.
- Read [references/source-patterns.md](references/source-patterns.md) when choosing density or looking for proven patterns from the audited projects.

## Follow this workflow

### 1. Understand the operation

- Read repository instructions, the active tracker, route structure, data contracts, roles, and permissions before editing.
- Identify who uses the console, how often, under what pressure, and which decisions cost time, money, safety, or trust.
- List the operator's top three questions. Typical examples: “What needs me now?”, “Is the system healthy?”, and “What changed?”
- Classify the console as a small-team back office, content/moderation console, commercial operations system, analytics manager, or regulated/governance command center.
- Inspect the live dashboard at desktop and mobile widths. Do not infer visual quality from source code alone.

### 2. Choose the right density

- Keep a small-team console direct: short navigation, a few truthful signals, recent work, and obvious next actions.
- Give a high-volume console grouped navigation, persisted state, badges, queues, filters, detail inspectors, and stronger status language.
- Use charts only when comparison, change over time, distribution, or threshold is central to a decision.
- Prefer actionable summaries and recent activity over vanity totals.
- Preserve the product's established brand language while cooling its marketing expression into a durable workspace.

### 3. Establish shared primitives

- Define theme tokens, shell geometry, type hierarchy, control radii, borders, shadows, status tones, spacing, and responsive breakpoints centrally.
- Build or refine shared rail, top bar, page header, panel, metric card, status chip, empty state, skeleton, pagination, table, action menu, dialog, and feedback primitives.
- Use a restrained radius hierarchy: approximately `8px` controls, `10px–16px` panels, and pills only for statuses, compact filters, or intentionally pill-shaped actions.
- Keep brand accents semantic. Use colour to distinguish state or domain, not to decorate every card differently.

### 4. Design the shell around orientation

- Make the current section, current user, role, environment, and active alerts immediately understandable.
- Group navigation by operator mental model rather than backend service boundaries.
- Filter navigation by role for clarity, but retain server-side authorization as the security boundary.
- Use collapse only when it materially returns workspace width. Persist the preference and provide tooltips or accessible labels in icon-only mode.
- Use a drawer on narrow screens, close it after navigation, support Escape/click-away, and manage focus.
- Keep global actions in the top bar; keep section actions near the section title.

### 5. Turn data into decisions

- Give each metric a label, value, context, freshness or comparison, and destination when action is possible.
- Never display failed or missing data as zero. Use an em dash, “Unavailable,” or a scoped error state.
- Put urgent exceptions, waiting work, blocked processes, and health degradation ahead of general totals.
- Pair aggregate information with the underlying queue, table, or inspector.
- Use realistic loading, empty, offline, partial-error, success, and permission-denied states.
- Confirm destructive or high-impact actions and explain their consequences.

### 6. Polish without weakening utility

- Use subtle radial or linear background fields, low-opacity semantic watermarks, accent rules, and restrained motion to make the console feel authored.
- Keep motion short and functional: shell entrance, section transition, progress feedback, hover lift, or count-up. Respect reduced motion.
- Maintain strong information density, whitespace, contrast, truncation, and responsive overflow.
- Avoid identical decorative KPI cards, excessive glass effects, random doodles, and large marketing headlines inside working screens.

### 7. Verify the real workflow

- Run formatting, lint, type checks, tests, and production build in proportion to risk.
- Inspect every changed state in a live browser: wide desktop, collapsed rail, tablet, mobile drawer, light/dark themes, empty/loading/error data, and long labels.
- Test keyboard navigation, focus order, tooltips, menus, dialogs, tables, chart alternatives, and reduced motion.
- Verify role visibility and authorization separately.
- Report the operator questions improved, the shared primitives changed, and the runtime evidence collected.

## Guardrails

- Do not invent metrics, trends, revenue, incidents, approvals, or health signals.
- Do not equate a hidden nav link with access control.
- Do not show destructive actions without confirmation and clear feedback.
- Do not turn a public storefront or marketing page into an admin control room.
- Do not copy another project's palette or brand marks; reuse its structural lesson.
- Do not force every admin into a dense collapsible rail when the operator set and route count are small.
- Do not claim success from a build alone when the request is visual.

## Completion standard

Deliver a console that feels native to its product, answers the operator's most important questions quickly, represents uncertainty honestly, works across breakpoints and input methods, and remains coherent as more workflows are added.
