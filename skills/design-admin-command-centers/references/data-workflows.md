# Data and Workflow Recipes

## Contents

- Overview as a briefing
- Metric cards
- Action queues
- Tables and record lists
- Charts
- System states
- High-impact actions
- Forms and settings

## Overview as a briefing

Structure an operational overview in this order:

1. A concise greeting or briefing header.
2. An honest error or freshness banner when required.
3. Three to eight decision-bearing metrics.
4. A “needs attention” queue or operational posture panel.
5. Recent activity or audit evidence.
6. Charts that explain a trend or distribution.
7. Quick actions for frequent tasks.

For a small back office, stop after items 1–5. More panels are not automatically more useful.

## Metric cards

Every card should answer:

- What is measured?
- What is the value?
- Is it good, bad, pending, or unknown?
- Compared with what period, threshold, or population?
- Where can the operator investigate or act?

Useful anatomy:

- Small semantic label.
- Large value.
- One short context line.
- Optional trend/status chip.
- Optional semantic icon or low-opacity watermark.
- Whole-card destination when the relationship is unambiguous.

Use equal-height grids when metrics form one set. Do not display `0` when the request failed; distinguish `0`, unknown, stale, and unavailable.

## Action queues

- Sort by urgency, age, risk, SLA, or lowest coverage—whichever maps to the operator's real priority.
- Show enough context to decide whether to open the record.
- Keep the status visible and language concrete.
- Provide a route to the full queue.
- Show a reassuring all-clear state when empty.
- Do not celebrate an empty queue if the API is offline.

## Tables and record lists

- Keep the primary identifying field visually dominant.
- Use compact secondary metadata and semantic status chips.
- Align numbers and dates consistently.
- Put row actions at the end and keep destructive actions in a menu or confirmed flow.
- Support search, filtering, sorting, and pagination only when the dataset warrants them.
- Preserve filter/page state in URL parameters when operators share or revisit views.
- Pair complex tables with an inspector drawer or detail page instead of forcing every field into columns.

## Charts

Use the simplest truthful encoding:

- Line/area: change over time.
- Bar: category comparison.
- Horizontal bar: long labels or ranked lists.
- Donut: a small part-to-whole breakdown with few categories.
- Progress/coverage bar: movement toward a known threshold.
- Status/posture rows: system health categories.

Include clear labels, units, period, and a custom tooltip. Avoid decorative 3D effects, excessive series, or colours without meaning. Keep a textual summary nearby for critical conclusions.

## System states

### Loading

- Mirror the final layout with skeletons.
- Preserve shell and page title so orientation does not disappear.
- Use a global progress strip for route or action latency.

### Empty

- State what is absent.
- Explain whether that is healthy, expected, or a setup gap.
- Offer one relevant action.
- Adjust layout for compact inline versus full-page empty states.

### Error or offline

- Scope the message to the failed data source.
- Preserve available sections when loading is partial.
- Offer retry when safe.
- Never replace missing data with reassuring zeroes.
- Show data freshness or last successful update when available.

### Success and mutation feedback

- Confirm what changed in plain language.
- Use toast/snackbar for nonblocking confirmation.
- Use inline feedback when it affects the next decision.
- Reconcile optimistic state with the server or roll back visibly.

### Permission denied

- Explain that access is restricted without exposing sensitive details.
- Provide a safe return destination.
- Keep this distinct from missing records.

## High-impact actions

- State the object, consequence, and reversibility.
- Require confirmation for deletion, suspension, payout, publication, mass messaging, role changes, or platform launch controls.
- Add stronger friction when the action is irreversible or affects many people.
- Record actor, time, target, and outcome in audit evidence when the domain requires it.

## Forms and settings

- Group fields by operator intention, not database schema.
- Keep controls around `8px` radius and use persistent labels.
- Place helper text near unfamiliar policy or financial fields.
- Keep save actions close to the scope they affect.
- Distinguish draft, dirty, saving, saved, and failed states.
- Prevent accidental loss when leaving a dirty high-cost form.
