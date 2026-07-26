# Shell and Navigation Recipes

## Shell anatomy

Use four stable regions:

1. **Rail or sidebar:** product identity, grouped destinations, active state, contextual badges, account/help footer.
2. **Top bar:** current section, global alerts, global search when real, theme control, user menu.
3. **Workspace:** constrained reading width for forms; wider canvas for tables, charts, and inspectors.
4. **Feedback layer:** progress bar, toast, modal, drawer, command menu, or help surface.

Keep sticky chrome stable while the workspace changes. Prevent horizontal overflow at the shell boundary with `min-width: 0` and deliberate table handling.

## Choose the navigation pattern

### Simple always-open sidebar

Use when there are roughly 15 or fewer items, few operators, and daily destinations all fit comfortably. Group labels plus simple active markers can be clearer than invented icons for abstract nouns.

### Grouped collapsible rail

Use when there are many workflows or operator domains.

- Persist group and rail state.
- Force or reveal the active group so the current route is never hidden.
- Allow the user to collapse an active group if the product promises manual control; avoid route logic that permanently locks it open.
- Use badges only for actionable counts.
- Provide icon tooltips and active markers in compact mode.

### Drawer on narrow screens

- Use one dedicated drawer surface rather than squeezing desktop navigation.
- Keep the full product identity and group labels.
- Close after a successful selection.
- Support Escape, click-away, focus return, safe-area padding, and scroll.
- Keep urgent badges visible without overcrowding.

## Brand block

- Show the native logo or mark, product/admin label, and optional environment or role context.
- Avoid surrounding the logo with an unnecessary frame when the mark already reads clearly.
- In compact mode, retain the mark and hide text without shrinking the hit area.
- Use a subtle monogram or watermark only if it does not reduce legibility.

## Active state

Use at least two cues:

- Surface or colour change.
- Weight, marker, connector, underline, or check.
- `aria-current="page"` for routed destinations.

Keep inactive items quieter but readable. Active state should remain evident in light and dark themes.

## Role-aware navigation

- Generate visible groups from role and capability metadata.
- Remove empty groups after filtering.
- Treat the filtered rail as presentation only.
- Enforce permissions on the route, loader/action, API, and high-impact mutations.
- Keep unauthorized and not-found states distinct.

## Top bar

- Lead with current domain/section and optional short description.
- On mobile, place the drawer trigger first.
- Put persistent global controls at the trailing edge: alerts, theme, help, user.
- Keep global search only when it is implemented and valuable.
- Put launch controls, environment switching, or emergency actions behind clear labels and confirmations.
- Keep profile destinations in the rail when they are primary workspaces; keep the user menu short.

## Contextual help

For complex operations, place short, section-specific guidance near the page title. Use a drawer, popover, tour, or guide page that explains terminology and safe workflows. Do not rely on a one-time onboarding tour as the only help.

## Responsive workspace

- Use a narrower maximum width for settings and forms.
- Use the full available width for tables, split inspectors, and charts.
- Collapse multi-column summaries from four to two to one.
- Convert data tables to horizontal scrolling or purpose-built mobile record cards; do not simply hide important columns.
- Stack header actions beneath titles when they no longer fit.

## Session and environment safety

- Show the signed-in identity and role.
- Distinguish production, staging, and sandbox environments where confusion is costly.
- Support inactivity lock for consoles containing sensitive personal or operational data.
- Place sign-out where it is discoverable but not adjacent to destructive record actions.
