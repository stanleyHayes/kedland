# Kedland admin, gallery, and footer UI correction design QA

## Comparison target

- Source visual truth: the 13 dark-dashboard defect crops supplied by the user in the current
  conversation. The chat attachments have no local filesystem path.
- Intended result: keep Kedland's existing dark command-centre language while removing washed-out
  light surfaces and replacing bare empty copy with a consistent, animated empty-state component.
- Browser-rendered implementation evidence: `artifacts/ui-qa-2026-07-26/overview.png`,
  `posts-empty.png`, `faqs-empty.png`, `enquiries-empty.png`, `media-empty.png`,
  `instagram-empty.png`, `users-controls.png`, `settings-security.png`, and `account-menu.png`.
- State: authenticated administrator, dark theme, desktop dashboard; empty and populated workflow
  states inspected as available from the local seeded database.

## Viewport and normalization

- Source crops: mixed embedded-image dimensions and crops; CSS viewport and density were not
  supplied. They were treated as native, defect-focused references.
- Implementation captures: `1419 × 774` or `1419 × 718` pixels at the browser's matching CSS
  viewport, 1x density.
- Normalization: comparisons were made region-to-region rather than by full-page pixel overlay
  because the source consists of focused crops. Each source crop was paired with the equivalent
  rendered control, panel, menu, form, table, or empty state.

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: Baloo/Nunito hierarchy remains intact; empty-state titles are distinct from
  supporting text, table labels remain readable, and compact menu copy no longer disappears on
  selected or hovered rows.
- Spacing and layout rhythm: empty states now share centered icon, title, description, and optional
  action spacing. Compact states fit side panels without excess height; full states fill list
  panels without becoming oversized.
- Colors and visual tokens: enquiry filters, staff actions, topbar controls, settings tabs, account
  shortcuts, metric cards, password fields, and visibility buttons now use dark navy surfaces with
  restrained blue borders. The bright white bevels shown in the source defect crops are gone.
- Image quality and asset fidelity: no photographic assets are needed in these administration
  states. Existing Kedland crest and icon-library glyphs remain sharp; no raster or placeholder
  replacements were introduced.
- Copy and content: bare “No records” strings were replaced with specific titles and useful next
  steps. Actions are present where recovery or creation is possible and omitted where no action is
  needed.
- Interaction and accessibility: empty states are labelled regions; icons are decorative; actions
  remain links or buttons; native checkboxes retain platform semantics; animation obeys
  `prefers-reduced-motion`; status chips expose readable text instead of color alone.

Focused-region comparison was required and completed for enquiry filters, pupil-consent
checkboxes, empty-list panels, the sidebar toggle, account menu shortcuts, staff actions, password
fields, sign-out treatment, topbar actions, Instagram actions, profile fields, and dashboard
metrics.

## Comparison history

1. Initial defect evidence showed light-theme neumorphic surfaces leaking into the dark theme,
   native checkboxes inheriting text-field styling, and several plain-text empty panels.
2. The shared empty-state primitive was expanded with icon motion, compact mode, semantic region
   labelling, title, description, and optional action. Posts, FAQs, pages, media, enquiries,
   Instagram, users, and audit states were migrated.
3. Named dark button, field, checkbox, metric, settings-tab, topbar, status-chip, and account-menu
   recipes replaced the washed-out controls. The first security capture exposed a remaining bright
   inset field bevel caused by cascade-layer priority.
4. The dark field override was moved into the same component cascade layer and the page was
   rebuilt. Post-fix evidence in `settings-security.png` confirms the bright inset bevel is removed;
   computed field shadows now use only subtle black and 2% white insets.
5. Final browser captures confirm consistent empty states and dark controls across Overview,
   Posts, FAQs, Enquiries, Media, Instagram, Users, Settings, and the account dropdown.

## Primary interactions tested

- Navigated the dashboard routes through visible sidebar links.
- Opened the account dropdown and verified its identity, shortcut, and sign-out sections.
- Switched to the Security settings tab and inspected all password and visibility controls.
- Checked enquiry filters, media consent checkboxes, staff action controls, and empty-state actions.
- Checked browser logs; remaining messages originate from installed Chrome extensions, not the
  Kedland application.

## Residual test gaps

- Destructive actions, password submission, file upload, staff removal, and sign-out were not
  executed during visual QA.
- Responsive mobile layout was not part of the supplied defect set.

## Gallery ashlar-mosaic follow-up

- Source visual truth: the gallery-gap screenshot supplied by the user in the current conversation;
  the chat attachment has no local filesystem path.
- Browser-rendered evidence:
  `artifacts/ui-qa-2026-07-26/gallery-ashlar-mosaic-viewport.jpg` at a `1419 × 774` CSS viewport,
  1x density.
- State: public `/gallery` route with six CMS starter photographs.
- Full-view comparison: the previous unequal-height placement left a large cavity below the first
  photograph. The replacement uses three fitted twelve-column courses—`7/5`, `4/8`, and `6/6`—so
  every course closes at the same right edge with no unoccupied grid cells.
- Focused-region evidence: live geometry measured all paired tile bottoms at `1151`, `1503`, and
  `1855` pixels respectively, with every course spanning from `x=174` to `x=1245`.
- Fonts and typography, colors, image fidelity, copy, overlays, rounded corners, hover treatment,
  lightbox behavior, and photographic crops remain unchanged. Only the spacing and layout recipe
  was corrected.
- Responsive behavior: the narrow layout uses two fitted columns with the third and sixth tiles
  spanning the full course; dense placement prevents intermediate gaps.
- Comparison history: the first live check still showed the obsolete six-column bundle. The public
  production app was rebuilt and restarted; the post-restart computed grid reports twelve columns,
  six fully fitted tiles, and a mosaic height reduced from `1392` to `1040` pixels.
- Primary interaction tested: loaded the production gallery, verified all six images completed,
  scrolled the mosaic into view, measured every tile boundary, and captured the final visual state.

## Footer contact action-card follow-up

- Source visual truth: the existing contact-page school-office action card, captured at
  `artifacts/ui-qa-2026-07-26/contact-action-card-reference.png`.
- Browser-rendered implementation evidence:
  `artifacts/ui-qa-2026-07-26/footer-contact-card-desktop.png` at `1419 × 718` and
  `artifacts/ui-qa-2026-07-26/footer-contact-card-mobile.png` at `390 × 844`, both at 1x density.
- Combined comparison evidence:
  `artifacts/ui-qa-2026-07-26/footer-contact-card-comparison.jpg`. The contact reference and footer
  implementation were normalized to a shared `1419 × 774` region before side-by-side review.
- State: public home page, footer in the default light appearance; desktop and narrow mobile
  breakpoints.
- Full-view comparison: the footer now repeats the contact card's two-part structure—address/action
  content above and divided phone rows below—while translating cream, sky and navy into translucent
  navy-deep footer surfaces, white copy and yellow action accents.
- Focused-region comparison: map and phone icons, section divider, row separators, full-row link
  targets and trailing chevrons match the source interaction pattern. The footer intentionally
  retains a more compact density to fit its three-column desktop grid.
- Fonts and typography: the established Kedland display and body faces, weights, uppercase eyebrow
  and readable phone-number hierarchy are preserved.
- Spacing and layout rhythm: the card uses a consistent rounded frame, `24–28px` internal padding,
  `48–56px` minimum action rows and aligned icon/text/chevron columns. At `390px`, the card is
  `342px` wide with `24px` page insets and no horizontal overflow.
- Colors and visual tokens: the footer's navy-deep background remains dominant; elevation comes from
  subtle translucent borders and dark/light neumorphic shadows rather than a cream card transplant.
- Image quality and asset fidelity: no raster assets are needed in this component; all icons use the
  shared icon library and the decorative footer stars remain unchanged.
- Copy and content: the verified address, directions destination and all three callable numbers are
  unchanged.
- Interaction and accessibility: every phone row is a full-width `tel:` link, directions opens
  safely in a new tab, visible focus rings are present, and the labelled section passed axe.
- Comparison history: the initial footer used loose address text, a disconnected pill and
  differently weighted phone numbers. The first implementation grouped those elements into a
  two-part footer-toned action card; the desktop and mobile visual passes found no remaining
  P0/P1/P2 issue, so no corrective visual iteration was required.
- Primary interactions tested: production home page loaded, all action rows were present, all three
  phone links retained correct `tel:` targets, desktop and mobile geometry was inspected, and page
  logs contained no Kedland application errors.

## Splash and not-found follow-up

- Public implementation evidence:
  `artifacts/ui-qa-2026-07-26/public-404.png` at a `1419 × 774` CSS viewport, 1x density.
- Public state: a real unmatched URL returned HTTP `404` and rendered the branded recovery card
  with Kedland crest, large numeral, explanatory copy, Home and Contact actions.
- Admin state: unauthenticated unmatched URLs correctly return to the staff sign-in boundary;
  authenticated not-found and loading surfaces are covered by the route component test.
- Both splash screens use their application's existing color system, identify the destination and
  expose polite loading status text. Decorative orbit/star motion is disabled under
  `prefers-reduced-motion`.
- Focused verification: public and admin route tests passed (`7` assertions across `2` route
  suites), recovery links retain semantic link roles, and the public production route returned the
  expected HTTP status.

## Adaptive navbar follow-up

- Intended behavior: the navigation sits as a regular full-width bar at the top of a page, contracts
  into the established floating pill after scrolling, and expands smoothly back into place on
  return to the top.
- Browser-rendered evidence:
  `artifacts/ui-qa-2026-07-26/navbar-settled-desktop.png`,
  `artifacts/ui-qa-2026-07-26/navbar-floating-desktop.png`,
  `artifacts/ui-qa-2026-07-26/navbar-settled-mobile.png`, and
  `artifacts/ui-qa-2026-07-26/navbar-floating-mobile.png`.
- Desktop geometry: at `1419 × 774`, the settled bar spans `1419px` from `x=0` with square outer
  corners. The floating bar contracts to the `1280px` design-system maximum, starts at `x=69.5`,
  and sits `16px` below the viewport edge.
- Mobile geometry: at `390 × 844`, the settled bar spans the full `390px`; after scrolling it
  becomes a `366px` pill with `12px` side/top insets and no horizontal overflow.
- Motion: both outer inset and inner width/radius/padding/elevation use the same `500ms`
  ease-out curve, producing one coherent morph instead of separate jumps. Scroll reads are
  animation-frame throttled and all transitions are disabled for reduced-motion users.
- Interaction and accessibility: the primary navigation, active-page indicator, dropdowns, CTA,
  theme control, quick links and mobile menu retain their original semantics and behavior.
- Verification: `58` header/navigation component tests, axe checks, strict type-check and the
  `20`-route production build pass. Browser logs contained no Kedland application errors.

## Admin form-dialog and theme-foundation follow-up

- All field-based creation and editing workflows in the dashboard now begin with a contextual
  action button and open in a shared native modal dialog. This covers posts, page sections, FAQs,
  Instagram tiles, media uploads and metadata, enquiry status, staff accounts and roles, profile,
  password and website settings.
- Direct one-click server actions such as publish, suspend, delete and sign out remain inline so
  operators are not forced through an empty dialog for an action that has no fields.
- The shared dialog supplies a labelled title and optional description, native Escape behavior,
  modal focus containment, a visible close action, body-scroll locking and focus return to the
  initiating button. Responsive size presets keep long forms scrollable within the viewport.
- Admin dark-mode preparation now applies the saved `light`, `dark` or `system` preference before
  first paint. The live production login boundary resolved the current system preference to
  `data-admin-theme="dark"` with a dark color scheme and the dashboard dialog has matching dark
  surface, field, border and backdrop treatments.
- Public dark-mode preparation now uses semantic page, surface, heading, text, muted and border
  tokens. Common cream, white, navy, ink, grey, border, neumorphic and form-control utilities have
  scoped dark equivalents while brand stickers remain white for crest legibility.
- Live public verification toggled dark → light → dark. The body changed from `rgb(7, 21, 30)` to
  `rgb(255, 251, 242)` and back, with `data-theme` and `color-scheme` following the selection. A
  dark-theme hero contrast defect found during the visual pass was corrected; its standfirst now
  renders at `rgb(158, 176, 187)` instead of retaining light-theme ink.
- Verification: admin `92/92` tests, web `327/327` tests, both lint suites, admin strict type-check,
  both production builds and `git diff --check` pass. Browser warnings were extension-originated;
  no Kedland application warning was found in the checked routes.

## Public theme reveal and dark interaction follow-up

- Theme changes now use a circular reveal originating at the sun/moon control. Browsers with the
  View Transitions API reveal the new rendered document through a growing circle; other browsers
  use a matching full-viewport circular wipe before settling the new palette.
- `prefers-reduced-motion: reduce` bypasses both animations and applies the theme immediately.
- Dark navigation states no longer inherit light-theme utility colors. Active, idle, current-away
  and hovered links now have explicit semantic colors, with a blue hover indicator and readable
  dark ink. Live hover measurement settled at `rgb(8, 34, 49)` on `rgb(159, 197, 219)`.
- Dropdown hover/current rows use a deep blue surface in dark mode rather than cream.
- The closing CTA no longer becomes a flat grey panel. It now uses a deep blue gradient, white
  heading, muted readable body copy and restrained star decoration. The secondary action reverses
  on hover to `rgb(237, 245, 248)` with `rgb(8, 34, 49)` text.
- Verification: strict type-check, lint, `92` affected theme/navigation/section tests, the isolated
  enquiry suite, the 20-route production build, live dark hover checks and `git diff --check` pass.

## Public palette and theme-invariant neumorphism follow-up

- The values tiles now keep one lighting model in both themes. In particular, the Loveable card's
  light-theme hover no longer inherits the generic white-card halo: its background and full
  three-part shadow are identical to the dark-theme result.
- Live computed Loveable hover shadow in both themes:
  `rgba(3,24,36,.4) 12px 14px 28px`, `rgba(61,155,233,.09) -6px -6px 15px`,
  plus the restrained white inset edge. The former bright bloom is absent.
- Translucent yellow, sky, green, pink and orange content cards no longer composite into muddy
  grey or olive blocks over the dark page. Academic subjects, EYFS areas, student-life moments,
  activity cards and admissions level cards use one readable navy-tinted surface while retaining
  their brand color as ambient light and badges.
- Larger warm and cool panels now have explicit dark-theme recipes. This covers the Early Years
  pathway, classroom teaching block, care block, admissions form/fees split and school-office
  panel. Headings resolve to `rgb(237,245,248)` and supporting copy to `rgb(158,176,187)`.
- Yellow tertiary buttons retain dark ink in dark mode, eliminating white-on-yellow labels.
  Current mobile/dropdown rows also use deep-blue selected surfaces instead of light cream.
- Verification: strict type-check, lint, `330` focused public tests, the 20-route production build,
  live light/dark Loveable comparison, and live academic/admissions/contact color inspection pass.

## Admin surface simplification follow-up

- Removed the 32px decorative background grid from the dashboard workspace in both light and dark
  themes. The workspace now uses the shell's solid background with no repeating image layer.
- Flattened decorative gradients across the dashboard shell, sidebar, active navigation, metrics,
  profile header, dialogs, empty states, splash and raised cards. Depth now comes from borders,
  restrained shadows and tonal separation rather than shifting color fields.
- Kept one narrow red–pink–yellow login accent stripe as the sole gradient because it functions as
  a small brand marker rather than a page-sized decoration.
- Verification: admin strict type-check, lint, `95` focused dashboard tests, the production build,
  a source audit confirming no dashboard gradients beyond the login accent, and `git diff --check`
  pass.

final result: passed
