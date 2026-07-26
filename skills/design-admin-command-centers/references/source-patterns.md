# Patterns Learned From Audited Projects

These are structural lessons, not templates to copy verbatim.

## Contents

- Oguaaman: culturally branded civic operations
- Kedland: minimal back office for a small team
- Xtiitch: dense commercial operator console
- Portfolio Dashboard: cohesive analytics and session safety
- NADAA: governance, readiness, and auditability
- Synthesis

## Oguaaman: culturally branded civic operations

Audited surfaces:

- `admin/src/components/layout.tsx`
- `admin/src/pages/Overview.tsx`
- `admin/src/components/metric-card.tsx`
- `admin/src/components/ui.tsx`
- `admin/src/index.css`

Reusable lessons:

- Carry a strong “Castle, Canopy, Canoe” palette into a calmer command-center shell.
- Group a large route set by moderation, alerts, community, monetization, publishing, and account work.
- Filter groups by role, persist open/collapsed state, and keep the active route visible.
- Use curved connectors, active checks, a subtle rail monogram, and semantic metric watermarks to make utility feel branded.
- Put “needs attention,” institution verification, quick actions, and queue state ahead of decorative analytics.
- Provide contextual help, a guided tour, skeletons, page transitions, MFA gating, and accessible custom controls.
- Preserve low-bandwidth fallbacks and avoid treating a visually hidden control as a security boundary.

## Kedland: minimal back office for a small team

Audited surfaces:

- `apps/admin/src/components/shell/app-shell.tsx`
- `apps/admin/src/components/shell/sidebar.tsx`
- `apps/admin/src/app/(dashboard)/page.tsx`
- `apps/admin/src/styles/globals.css`

Reusable lessons:

- Do not overbuild navigation for three people and roughly fifteen destinations.
- Keep groups open when everything fits and daily access matters more than screenshot tidiness.
- Use simple position markers instead of inventing confusing icons for abstract nouns.
- Ask “Is anything waiting?” and “What do I do next?” before adding charts.
- Represent API failure as an em dash and warning, never as zero.
- Keep the public brand palette but reduce type scale and decorative intensity for all-day work.

## Xtiitch: dense commercial operator console

Audited surfaces:

- `apps/admin/app/routes/admin.tsx`
- `apps/admin/app/features/shell/`
- `apps/admin/app/features/overview/`
- `apps/admin/app/components/ui/`
- `apps/admin/app/theme.ts`

Reusable lessons:

- Use a collapsible fixed rail, mobile drawer, sticky top bar, notifications, section help, theme control, and launch controls for a multi-domain platform.
- Persist section state in the URL so workspaces can be revisited and shared.
- Treat the overview as a calm briefing across revenue, operations, trust, and customer pressure.
- Split the overview into shared stats, activity, and charts rather than one oversized component.
- Use `8px` control radii, pill buttons by intent, theme-aware surfaces, and reduced-motion support.
- Show global progress, section skeletons, action feedback, and partial API warnings without discarding the rest of the page.

## Portfolio Dashboard: cohesive analytics and session safety

Audited surfaces:

- `admin/src/theme/index.ts`
- `admin/src/components/Layout.tsx`
- `admin/src/components/Sidebar.tsx`
- `admin/src/pages/DashboardPage.tsx`
- `admin/src/pages/AnalyticsPage.tsx`

Reusable lessons:

- Centralize light/dark palettes, typography, radius, tables, fields, cards, chips, and buttons in the theme.
- Use subtle radial workspace backgrounds and glass only in sticky chrome.
- Persist rail collapse, retain a mobile drawer, and provide an inactivity lock for sensitive sessions.
- Give charts branded tooltips, readable legends, responsive containers, and consistent wrappers.
- Use asymmetric icon chips or accent rules to prevent KPI cards from feeling generic.
- Keep content management signals and visitor analytics separated when their operator questions differ.

## NADAA: governance, readiness, and auditability

Audited surfaces:

- `apps/admin-web/src/features/administration/AdminConsoleShell.tsx`
- `apps/admin-web/src/features/administration/components/Sidebar.tsx`
- `apps/admin-web/src/features/administration/components/Topbar.tsx`
- `apps/admin-web/src/features/administration/components/views/OverviewView.tsx`
- `apps/admin-web/src/features/administration/components/primitives.tsx`

Reusable lessons:

- Derive notifications from conditions that require action, such as missing MFA or unavailable governance APIs.
- Sort readiness lists by lowest coverage first so the weakest posture becomes visible.
- Pair coverage metrics with progress bars, agency detail, operational posture, and audit evidence.
- Persist selected view and navigation state; provide contextual page guides and a replayable tour.
- Use semantic metric watermarks, short count-up animation, and immediate final values under reduced motion.
- Keep human approval visible for safety-critical or mass-impact workflows.

## Synthesis

Across the projects, the strongest repeated pattern is not a particular card style. It is the combination of:

1. Brand-aware shell.
2. Navigation matched to route and role complexity.
3. Truthful data states.
4. Actionable queues and recent evidence.
5. Shared primitives that hold up across themes and breakpoints.
6. Polished motion and ornament that never obscure operation.
