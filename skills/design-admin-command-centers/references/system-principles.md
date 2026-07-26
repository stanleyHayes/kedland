# Admin Design System Principles

## The operator-first test

An admin dashboard succeeds when an operator can answer these questions quickly:

1. Where am I?
2. What needs attention now?
3. Is the system healthy and the data current?
4. What changed recently?
5. What is the safest next action?

Arrange the interface in that order. A visually impressive dashboard that cannot answer them is decoration.

## Match the console to its operating model

| Model                  | Typical users                  | Recommended density | Overview priority                                                    |
| ---------------------- | ------------------------------ | ------------------- | -------------------------------------------------------------------- |
| Small-team back office | 1–5 frequent generalists       | Low                 | Waiting work, recent content, next actions                           |
| Content or moderation  | Editors, curators, reviewers   | Medium              | Queue size, urgent reports, publishing state, recent decisions       |
| Commercial operations  | Support, finance, risk, growth | High                | Revenue health, verification, blocked money flows, customer pressure |
| Analytics manager      | Owner or content manager       | Medium              | Trends, acquisition mix, recent activity, content performance        |
| Governance or safety   | Authority users, auditors      | High but calm       | Coverage gaps, incidents, system posture, approvals, audit evidence  |

Do not begin with a component library. Begin with the operator model and the cost of a missed signal.

## Visual temperature

Carry the product's brand into the console with less theatrical intensity:

- Use the deepest brand colour for the rail or key structural chrome.
- Use a warm or neutral workspace background for long sessions.
- Reserve bright brand accents for active navigation, focus, actions, and important state.
- Use one display face for compact section headings only; use a highly legible UI face for controls, data, tables, and body copy.
- Prefer subtle gradients, texture, or radial light over large ornamental illustrations.
- Use dark mode only with genuine token coverage; never invert a few surfaces and leave charts, borders, menus, or empty states stranded.

## Shape and elevation

- Controls: about `8px` radius.
- Compact navigation rows and chips: `6px–10px` or pill only where semantically useful.
- Cards and panels: about `10px–16px` radius.
- Dialogs and drawers: about `12px–18px`, proportionate to their scale.
- Use thin borders and tonal separation before heavy shadows.
- Use stronger shadow primarily for rails, menus, dialogs, sticky chrome, or hover elevation.

Avoid a page where every surface is a floating rounded rectangle. Use rows, dividers, grouped panels, and open layouts alongside cards.

## Information hierarchy

- Use an eyebrow for workspace or domain context.
- Use a concise page title that describes the task.
- Add one helper sentence only when it changes how the page should be used.
- Keep the primary section action near the title.
- Put KPI value before explanation, but always retain label and context.
- Use status language people can act on: “3 awaiting MFA” is better than “MFA: 78%” by itself.
- Keep tables and queues closer to the top when the main job is processing records.

## Semantic colour

Define status tones centrally:

- Success or healthy: green/teal.
- Attention or pending: amber/gold.
- Destructive, failed, or urgent: red/clay.
- Information or in progress: blue/teal.
- Neutral, draft, or inactive: grey/slate.

Never use these colours purely to create variety in a KPI row. A red metric must mean something different from a green metric.

## Brand expression that scales

Use custom touches sparingly and repeatedly:

- A culturally or institutionally meaningful rail treatment.
- A product-specific mark, texture, or low-opacity monogram.
- Semantic icon watermarks in metric cards.
- One distinctive accent rule or corner treatment.
- Branded but readable loading, empty, and sign-in states.

Copy the principle—not another project's palette, logo, or exact ornament.

## Motion

- Use `160–240ms` transitions for hover, focus, rail width, and menu state.
- Use `280–520ms` for a shell or section entrance.
- Use count-up only for summary metrics and show final values immediately under reduced motion.
- Use a thin global progress indicator for route or mutation work when latency is visible.
- Avoid staggered animation on large tables or queues.

## Accessibility and trust

- Maintain visible focus across all themes.
- Give icon-only controls accessible names and tooltips where useful.
- Ensure collapsed navigation retains labels through tooltips and `aria-label`.
- Provide text or table equivalents for chart information that drives decisions.
- Do not communicate status with colour alone.
- Use semantic tables for comparative records and lists for activity feeds.
- Announce mutation success/failure and loading state appropriately.
