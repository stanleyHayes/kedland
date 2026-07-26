# Kedland International School — Agent Build Plan

> **Client:** Kedland International School (KIS) — Community 19 Annex, Lashibi-Tema, Greater Accra, Ghana
> **Agency:** XCreativs Technologies
> **Repository:** `git@github.com:stanleyHayes/kedland.git`
> **This document** is the agent's build plan: the _how_. It restates the decisions, architecture,
> folder structure, data model, quality gates and build order for the delivered stack.
>
> **Read first:** [`Kedland_Website_Build_Package.md`](Kedland_Website_Build_Package.md) — the product spec
> and, critically, the **final ship-ready page copy** (§4). That document is the _why_ and _what_.
> This one is the _how_. Where the two disagree on technology, **this document wins** (see §0.1);
> where they disagree on **copy, brand or content**, the **build package wins, always**.
>
> **Status:** **Phase 0 complete.** Foundation, quality gates and CI are in place and green:
> format · lint · typecheck · 80%+ coverage · build · browser tests. No product features yet.
> §10 is the living implementation ledger — update it as things ship.

---

## 0. Decisions taken

### 0.1 Stack revision — supersedes Build Package §6.1

The build package recommended a **static/headless** architecture (Astro + a Git-based CMS on
Cloudflare Pages). The build target has been changed to the team's house stack. The brand system
(package §2), sitemap (§3), page copy (§4) and feature requirements (§5) are stack-agnostic and
carry over **unchanged**.

| #   | Decision        | Chosen                                                                                                                | Why                                                                                                                                                                                                                                                                                               |
| --- | --------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Public site     | **Next.js (App Router) + TypeScript + Tailwind**                                                                      | Server Components + ISR give static-file speed with live CMS content; first-class image optimisation and metadata API serve the Lighthouse ≥ 90 / LCP < 2.5s target for parents on Ghanaian mobile data.                                                                                          |
| 2   | Admin dashboard | **Separate Next.js app** (`apps/admin`)                                                                               | Admin JS never ships to parents; independent deploy cadence; separate auth surface and cookie scope; cleaner SonarQube module boundaries.                                                                                                                                                         |
| 3   | Backend         | **NestJS + TypeScript**                                                                                               | Opinionated module/DI structure keeps cognitive complexity low (Sonar-friendly by construction); first-class testing story; one language across the whole repo.                                                                                                                                   |
| 4   | Database        | **MongoDB (Mongoose)** — Atlas                                                                                        | Document model fits the polymorphic "page section" content blocks and the blog cleanly; no migrations tax for a content-shaped domain.                                                                                                                                                            |
| 5   | Blog authoring  | **TipTap → markdown**                                                                                                 | WYSIWYG that feels like Google Docs (package §5.4's requirement) but persists clean markdown, not HTML soup. Headless, so the toolbar is exactly the six affordances the spec allows and nothing more.                                                                                            |
| 6   | Static text     | **CMS-backed, structured**                                                                                            | Page copy lives in Mongo as typed section documents, seeded with the final §4 copy. See §0.2 for the guardrails.                                                                                                                                                                                  |
| 7   | Header design   | **Variant 4** of the supplied navbar reference                                                                        | Split bar: wave-backed logo lockup, centred nav capsule, gradient CTA pill, grid-dots menu. Specified in §2.6.                                                                                                                                                                                    |
| 8   | Hosting         | **Vercel** (web, admin) · **Render Blueprint** (api) · **MongoDB Atlas** · **Cloudinary** (media) · **Resend** (mail) | Vercel for the two Next apps (edge CDN, ISR, preview deploys); the Nest API ships as a **`render.yaml` Blueprint** so the service, its Docker build and its whole env contract are versioned in the repo — infrastructure reviewed in PRs, not clicked into a dashboard. Atlas for managed Mongo. |
| 9   | Monorepo        | **pnpm workspaces + Turborepo**                                                                                       | Shared types/config/UI without publishing; `--affected` keeps CI fast.                                                                                                                                                                                                                            |
| 10  | Package manager | **pnpm**                                                                                                              | Workspace-native, strict node_modules, fast CI cache.                                                                                                                                                                                                                                             |

**Unchanged from the build package and non-negotiable:** the design north star (§2.1), the colour
and type tokens (§2.3–2.4), the roundness/wave/blob language (§2.5), safeguarding and child-image
consent (§2.6), the sitemap (§3), every word of the page copy (§4), no online admission form, the
curated-manual Instagram showcase (no API, no tokens, no cost), and the punch list (§8 → §11 here).

### 0.2 The CMS reversal — flagged, and how it is contained

Build package §0 and §6.1 state plainly: _"the previous Kedland site died from uncontrolled
multi-user edits on a heavy CMS. We are not repeating that."_ The direction to serve **most static
text from the CMS** reverses that decision. It is the client's call and it is being built — but the
original failure mode is engineered out rather than ignored:

| Failure mode of the old site                 | Guardrail here                                                                                                                                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anyone could restructure a page              | **Sections are a fixed, code-owned registry.** Editors change _values inside_ a section. They cannot add, remove, reorder or restyle sections. Layout lives in React, not in the database.              |
| Free-form rich text everywhere               | **Typed fields.** A heading is a string with a max length; a card list has exactly four entries; the KEDLAND tiles are exactly seven. Only the blog body is free-form markdown.                         |
| Edits went live unreviewed and unrecoverable | **Revision history on every content document** + restore-to-version. Every write lands in the **audit log** (who · what · when · before → after).                                                       |
| Uncontrolled user accounts                   | **Two roles, 2–3 accounts.** `admin` (everything + user management) and `editor` (content + posts, no users, no settings). Argon2 passwords, strong-password policy, rate-limited login, session audit. |
| CMS edits broke the design                   | Content is validated server-side against the same schema the form is generated from. A rejected value never reaches the page.                                                                           |
| Site slowed to a crawl                       | Pages are **statically rendered and cached by tag**; publishing fires a revalidation webhook. A parent's request never waits on Mongo.                                                                  |

**Explicitly still locked to code:** routes, section order and existence, component internals, brand
tokens, typography, spacing, the EYFS honeycomb geometry, and every legal/safeguarding page.

### 0.3 Out of scope (unchanged)

Online payments · online admissions portal with parent logins · parent/student portal · e-commerce ·
fee payment · LMS features · automated Instagram feed / Graph API / paid widgets · public user
registration. If any surfaces mid-build: **stop and flag** — they change the architecture.

---

## 1. Product summary

A custom informational website for a British-curriculum early-years and lower-primary school
(**Daycare through Primary 3**), plus a minimal back-office. Eight public pages. Core jobs:

1. Present the school warmly and credibly to prospective parents.
2. Let a parent **download an admission form** (PDF). There is **no online admission form**.
3. Let a parent **enquire** via a short contact form that emails the school.
4. Show a **curated, manually-updated Instagram showcase** — free, no API, no tokens.
5. Give the school's team a dashboard to publish **blog/news** and edit **page copy**.

Pupils are called **"Stars."** Positioning line: **"We focus on the WHY."** Tagline: **"The future
begins here."** Motto: **"In God We Trust."**

---

## 2. Design system

Tokens are canonical in [`Kedland_Website_Build_Package/assets/brand/brand-tokens.css`](Kedland_Website_Build_Package/assets/brand/brand-tokens.css)
and are ported to Tailwind theme variables in `packages/ui/src/styles/tokens.css`. **One source of
truth** — no hex literals in components, ever (enforced by an ESLint rule, §7.2).

### 2.1 North star

> **"A three-year-old should smile at it, and their parent should trust it."**

Bright, warm, rounded, playful — but clean, fast and legible enough that a parent takes the school
seriously. Every screen must signal _"this is a school for young children"_ within one second.

### 2.2 Colour

| Token         | Hex       | Role                                                   |
| ------------- | --------- | ------------------------------------------------------ |
| `--navy`      | `#0B4A6D` | Primary. Logo, headings, footer, primary text-on-light |
| `--navy-deep` | `#08334C` | Dark sections, footer background, overlays             |
| `--yellow`    | `#F7CE46` | Sunshine. Highlights, playful blocks (dark text only)  |
| `--red`       | `#E0322C` | Energy. Primary CTAs, key emphasis                     |
| `--pink`      | `#E5388A` | Playful accent, tags, "Stars" motif                    |
| `--blue`      | `#3D9BE9` | Friendly bright blue, links, secondary accents         |
| `--sky`       | `#BBD5EF` | Soft backgrounds, cards, section tints                 |
| `--green`     | `#4CB782` | Supplementary accent (sparingly)                       |
| `--orange`    | `#F59331` | Supplementary warm accent                              |
| `--cream`     | `#FFFBF2` | Default page background                                |
| `--ink`       | `#12283A` | Body text                                              |
| `--white`     | `#FFFFFF` | Cards, reversed text                                   |
| `--grey`      | `#6B7A88` | Muted/secondary text, captions                         |

> **Two corrections applied during Phase 0.** Building the contrast gate surfaced two pairings in
> the supplied palette that fail the 4.5:1 floor §2.3 itself mandates:
>
> | Token                                                              | Supplied  | Measured | Corrected                  | Now    |
> | ------------------------------------------------------------------ | --------- | -------- | -------------------------- | ------ |
> | `--grey` on `--cream`                                              | `#6B7A88` | 4.27:1   | `#687684`                  | 4.51:1 |
> | `--red` as text on `--cream` _(the package's own `.eyebrow` rule)_ | `#E0322C` | 4.36:1   | new `--red-text` `#DF2B25` | 4.51:1 |
>
> Both keep hue and saturation exactly and drop lightness by under 2% — visually indistinguishable.
> `--red` itself is unchanged, so CTA buttons stay on the red the school approved; the new token is
> for red _text_ only. Raise both with the client at sign-off. Asserted in
> `packages/ui/src/lib/contrast.spec.ts`; reverting either turns the suite red.

**Enforced accessibility rules:** body = `--ink` on `--cream`/`--white`. **Never** white or yellow
text on `--yellow`, never light text on `--sky`; on yellow blocks use `--navy`/`--ink`. CTAs =
`--red` background + white text. Links = `--blue`, underline on hover. ≥ 4.5:1 body, ≥ 3:1 large
text and icons. A **contrast unit test** asserts every token pair used in `packages/ui` (§7.4).

### 2.3 Typography

- **Display / headings:** **Baloo 2** (700/800) — H1–H3, hero, section titles, buttons.
- **Body / UI:** **Nunito** (400/600/700) — paragraphs, labels, nav, forms.
- **Self-hosted** via `next/font/local`, Latin subset, `font-display: swap`. No Google CDN request.
- Fluid scale: H1 `clamp(2.2rem,5vw,3.6rem)` · H2 `clamp(1.6rem,3.5vw,2.4rem)` · H3 `1.25rem` ·
  body `1.05rem` · small `0.9rem`. Line-height 1.15 headings / 1.65 body. Eyebrows uppercase, `0.06em`.

### 2.4 Shape, motion, components

Radii `--r-sm:12px` `--r-md:20px` `--r-lg:32px` `--r-pill:999px` — **no sharp corners anywhere**.
Sections separated by **wavy SVG dividers**, not straight rules. Organic blob shapes behind imagery.
Light decorative spot art: stars, squiggles, confetti dots, blocks, clouds, a rainbow arc.
Pill buttons, chunky padding `14px 28px`, bold Baloo 2, soft shadow, `scale(1.04)` on hover, tap
targets ≥ 48px. Cards: white on cream, `--r-lg`, `0 10px 30px rgba(11,74,109,.10)`, hover lift.
Gentle float on hero art, fade-up on scroll. **`prefers-reduced-motion` disables all of it** —
asserted by a Playwright test, not just a media query.

### 2.5 Imagery & safeguarding ⚠️

Bright, warm, real photos of young children at play and learning, in the pink/blue check uniform.
No corporate stock adults. Rounded corners, occasional blob masks, playful `rotate(-2deg)` tilt.

> ⚠️ **Child-image consent is a hard gate.** Any photo of an identifiable real pupil requires
> **written parental consent on file** before it goes public (Ghana Data Protection Act; the subjects
> are minors; this is the school's legal exposure). The media library carries a mandatory
> `consentOnFile: boolean` + `consentRef` field; **the API rejects publishing any image tagged
> `depictsPupils: true` without it.** This is enforced in code, not policy. See §11.

Every image: `alt` text required (schema-level), lazy-loaded below the fold, AVIF/WebP with
fallback, explicit dimensions, ≤ 250 KB.

### 2.6 Global header — navbar variant 4

Adapted from the supplied reference (row 4) into Kedland's palette. Purple → brand; the reference's
lavender wave is exactly the "wave/blob" language already in the build package §2.5, so it lands
naturally.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ╭─────────────╮                                                                  │
│ │ ~~~~~~~~╮   │  ⌜ Home  About  Academics ⌄  Admissions  Student Life  News ⌝     │
│ │ [LOGO] Kedland│ ╰──────────────── nav capsule ──────────────────╯   ( Enrol Now →) ⣿ │
│ │ ~~~~~~~~╯   │    ▔▔▔▔                                                          │
│ ╰─────────────╯                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
   wave lockup          centred pill nav                  gradient CTA    grid menu
```

- **Bar** — `--white`, `--r-lg` (32px), `--shadow-card`, inset from the viewport edge with margin.
  Sticky with `backdrop-filter: blur(12px)` and a slight shrink after 80px of scroll.
- **Left lockup** — an SVG **wave** in a `--sky` → `--blue` gradient sweeping from the left edge and
  curving into the white field (the reference's lavender S-curve, recoloured). Logo sits on top at
  40px tall (32px mobile), with the wordmark **Kedland** in Baloo 2 and the strapline
  _"The future begins here."_ in Nunito beneath. Logo clearspace = one star height. **Scale only —
  never redraw, recolour or add effects.**
- **Divider** — 1px `--sky` vertical rule between lockup and nav.
- **Centre capsule** — a `--r-pill` container, `--cream` fill, 1px `--sky` border, holding the nav
  links. Active link: `--navy`, weight 700, with a short `--red` underline beneath (2px, `--r-pill`).
  Inactive: `--grey`. Hover: `--navy`. **Academics** carries a chevron → a rounded dropdown
  (Early Years · Primary); **About** likewise (Our Story · Mission, Vision & Values · Principal ·
  Facilities). Dropdowns are keyboard-navigable, `Escape` closes, focus returns to the trigger.
- **CTA** — pill, `--red` → `--pink` gradient, white Baloo 2 label **"Enrol Now"** → `/admissions`,
  with a circular white chip holding a `→` arrow (mirrors the reference's arrow chip). Solid `--red`
  fallback where gradients are unavailable. `scale(1.04)` on hover.
- **Grid-dots button** — the 3×3 dots from the reference. Opens a rounded **quick-links panel**:
  Contact · FAQs · Download admission form · Instagram · Book a tour. On `< lg` this same control
  becomes the menu trigger for the full-screen playful mobile menu (large tap targets, stacked
  links, CTA at the bottom).
- **A11y** — `<header>` + `<nav aria-label="Primary">`, skip-to-content link as the first focusable
  element, `aria-current="page"` on the active link, `aria-expanded`/`aria-controls` on every
  disclosure, visible focus rings in `--blue` throughout.

### 2.7 Global footer

`--navy-deep` with a **wavy top edge**. White logo "sticker" card (the logo is navy — never place it
bare on navy) + tagline _"The future begins here."_ · quick links · contact block (phones, location,
email) · social icons · the small _"In God We Trust"_ line · © Kedland International School ·
_"Website by XCreativs Technologies."_ All of it CMS-driven from the `settings` document.

### 2.8 Recurring components

**CTA banner** (_"Ready to begin your child's journey?"_ + Enrol/Contact) above the footer on most
pages · **Instagram showcase** on Home and Contact · **wavy dividers** between every coloured band
(alternating cream / sky / navy).

---

## 3. Repository structure

Monorepo, pnpm workspaces, Turborepo. Three deployable apps, four shared packages.

```
kedland/
├── apps/
│   ├── web/                            Next.js — public site
│   ├── admin/                          Next.js — back-office dashboard
│   └── api/                            NestJS — REST API + MongoDB
├── packages/
│   ├── types/                          Shared DTOs, enums, content-section contracts
│   ├── ui/                             Shared primitives, brand tokens, skeletons
│   ├── config/                         eslint / tsconfig / tailwind / prettier presets
│   └── testing/                        Shared test setup, factories, fixtures
├── content/
│   └── seed/                           Build-package §4 copy as typed seed data
├── docs/
│   ├── admin-guide.md                  Handover guide for school staff
│   ├── architecture.md
│   ├── content-model.md                The section registry, documented
│   └── runbook.md                      Deploy, rollback, restore, incident
├── Kedland_Website_Build_Package.md    Product spec + final copy (source of truth for content)
├── Kedland_Website_Build_Package/      Logo, favicons, diagrams, brand tokens
├── .github/workflows/ci.yml
├── agent_plan.md                       ← this document
├── sonar-project.properties
├── render.yaml                         Render Blueprint — the API service + env contract
├── docker-compose.yml                  Local Mongo + Mongo Express
├── turbo.json
├── pnpm-workspace.yaml
├── .env.example
└── README.md
```

### 3.1 `apps/web` — public site

```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  Root: fonts, tokens, header, footer, JSON-LD
│   │   ├── page.tsx                    Home
│   │   ├── loading.tsx  error.tsx  not-found.tsx
│   │   ├── about/
│   │   │   ├── page.tsx
│   │   │   ├── our-story/page.tsx
│   │   │   ├── mission-vision-values/page.tsx
│   │   │   ├── principal/page.tsx
│   │   │   └── facilities/page.tsx
│   │   ├── academics/
│   │   │   ├── page.tsx
│   │   │   ├── early-years/page.tsx    EYFS + the 7-area honeycomb
│   │   │   └── primary/page.tsx        Cambridge + 9 subject cards
│   │   ├── admissions/page.tsx
│   │   ├── student-life/page.tsx
│   │   ├── news/
│   │   │   ├── page.tsx  loading.tsx
│   │   │   └── [slug]/page.tsx  loading.tsx  not-found.tsx
│   │   ├── contact/page.tsx
│   │   ├── faqs/page.tsx
│   │   ├── privacy/page.tsx
│   │   ├── api/
│   │   │   ├── enquiry/route.ts        Proxies the form; Turnstile secret stays server-side
│   │   │   └── revalidate/route.ts     Webhook from the API on publish (shared secret)
│   │   ├── sitemap.ts  robots.ts  opengraph-image.tsx
│   ├── components/
│   │   ├── layout/                     site-header · nav-capsule · nav-dropdown · quick-links
│   │   │                               mobile-menu · site-footer · wave-divider · cta-banner
│   │   ├── sections/                   One component per registry section key (§4.1):
│   │   │                               hero · welcome-strip · why-cards · level-cards
│   │   │                               values-tiles · principal-teaser · instagram-showcase
│   │   │                               prose-band · eyfs-honeycomb · subjects-grid
│   │   │                               enrol-steps · download-block · day-timeline
│   │   │                               activity-chips · faq-accordion · contact-details · map
│   │   ├── news/                       post-card · post-grid · post-body · share-buttons
│   │   │                               related-posts · category-filter · empty-state
│   │   ├── forms/                      enquiry-form · field · consent · turnstile · success
│   │   ├── skeletons/                  One per section + post-card/grid/article
│   │   └── seo/                        json-ld (School · FAQPage · Article · BreadcrumbList)
│   ├── lib/
│   │   ├── api/                        Typed server-side client; tagged fetch + revalidate
│   │   ├── content/                    Section resolver: key → component, with fallbacks
│   │   ├── seo/                        generateMetadata builders per page
│   │   └── utils/
│   └── styles/globals.css
├── public/                             Logo, favicons, diagrams, admission PDF, IG tiles
├── e2e/                                Playwright specs
├── next.config.ts  tailwind.config.ts  eslint.config.mjs  vitest.config.ts
└── package.json
```

**Rendering.** Every public page is a Server Component that fetches its sections from the API with
`fetch(..., { next: { tags: ['content:home'] } })`. Pages are statically rendered at build and served
from Vercel's edge. Publishing content or a post calls `POST /api/revalidate` on the web app, which
runs `revalidateTag(...)` — the page regenerates once, then serves static again. **A parent's request
never touches Mongo.** Only the enquiry form is dynamic.

### 3.2 `apps/admin` — dashboard

App shell modelled on the oguaaman admin (`admin/src/components/layout.tsx`): fixed dark sidebar with
collapsible grouped nav and curved tree connectors, collapsible to a 64px icon rail, sticky header
carrying the contextual page title, context-help, search, theme toggle and user menu, and a
`PageSkeleton` shown on every route transition. Recoloured to Kedland (`--navy-deep` sidebar,
`--yellow` accents replacing gold), and scaled down to this project's much smaller surface.

```
apps/admin/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── forgot-password/page.tsx  ·  reset-password/[token]/page.tsx
│   │   └── (dashboard)/
│   │       ├── layout.tsx              The shell: sidebar + header + skeleton boundary
│   │       ├── page.tsx                Overview — KPIs, recent posts, unread enquiries
│   │       ├── loading.tsx
│   │       ├── posts/
│   │       │   ├── page.tsx            List: search, status tabs, category filter
│   │       │   ├── new/page.tsx
│   │       │   └── [id]/edit/page.tsx  TipTap editor + sidebar (slug, SEO, cover, category)
│   │       ├── content/
│   │       │   ├── page.tsx            Page picker
│   │       │   └── [page]/page.tsx     Schema-generated section forms + live preview link
│   │       ├── faqs/page.tsx           Grouped list, inline edit, reorder within group
│   │       ├── enquiries/
│   │       │   ├── page.tsx            Inbox: new / read / replied / archived
│   │       │   └── [id]/page.tsx
│   │       ├── media/page.tsx          Library + upload + alt text + consent gate
│   │       ├── instagram/page.tsx      Curated tiles: image, caption, link, order
│   │       ├── settings/page.tsx       Contact block, hours, socials, SEO defaults, PDF
│   │       ├── users/page.tsx          admin only
│   │       ├── audit/page.tsx
│   │       ├── profile/page.tsx
│   │       └── help/page.tsx           In-app version of docs/admin-guide.md
│   ├── components/
│   │   ├── shell/                      sidebar · nav-config · nav-group · header
│   │   │                               user-menu · theme-toggle · context-help · tour
│   │   ├── editor/                     tiptap-editor · toolbar · image-upload · link-dialog
│   │   │                               markdown-serializer · character-count
│   │   ├── content/                    section-form (schema-driven) · field renderers
│   │   │                               repeatable-list · image-field · revision-drawer
│   │   ├── data/                       data-table · pagination · status-tabs · empty-state
│   │   ├── skeletons/                  page · table · form · editor · card-grid
│   │   └── ui/                         button · input · select · textarea · dialog · toast
│   │                                   badge · card · tabs · dropdown · confirm
│   ├── lib/                            api client · auth (session) · hooks · format · guards
│   └── styles/globals.css
├── e2e/
└── ...config
```

**Sidebar nav groups** — deliberately small; this is a back-office for 2–3 people, not a platform.

| Group          | Items                                                                |
| -------------- | -------------------------------------------------------------------- |
| **Dashboard**  | Overview                                                             |
| **Publishing** | Posts · Categories                                                   |
| **Content**    | Pages · FAQs · Instagram · Media library                             |
| **Enquiries**  | Inbox                                                                |
| **Account**    | Users _(admin only)_ · Audit log · Settings · Profile · Help & guide |

### 3.3 `apps/api` — NestJS

```
apps/api/
├── src/
│   ├── main.ts                         Helmet, CORS allowlist, versioning, Swagger, shutdown hooks
│   ├── app.module.ts
│   ├── config/
│   │   ├── configuration.ts            Typed config factory
│   │   └── env.validation.ts           Zod schema — the process refuses to boot on a bad env
│   ├── common/
│   │   ├── decorators/                 @Public · @Roles · @CurrentUser · @AuditAction
│   │   ├── guards/                     jwt-auth · roles · throttler
│   │   ├── interceptors/               logging · transform-response · audit
│   │   ├── filters/                    all-exceptions (RFC 7807 problem+json)
│   │   ├── pipes/                      zod-validation
│   │   └── dto/                        pagination · id-param
│   ├── database/
│   │   ├── database.module.ts
│   │   └── seeds/
│   │       ├── seed.command.ts         `pnpm --filter api seed [--force]`
│   │       ├── content.seed.ts         All build-package §4 copy
│   │       ├── faqs.seed.ts  settings.seed.ts  instagram.seed.ts
│   │       └── users.seed.ts           First admin from env
│   ├── modules/
│   │   ├── auth/                       Login, refresh rotation, logout, password reset
│   │   ├── users/                      Staff accounts, roles, status
│   │   ├── posts/                      Blog CRUD, slug, draft/publish, revisions
│   │   ├── content/                    Page sections — the CMS core, schema registry
│   │   ├── faqs/
│   │   ├── media/                      Cloudinary signed upload, asset records, consent gate
│   │   ├── enquiries/                  Contact form intake → Resend → persist
│   │   ├── instagram/                  Curated tiles
│   │   ├── settings/                   Singleton site settings
│   │   ├── revisions/                  Generic version history + restore
│   │   ├── audit/                      Append-only action log
│   │   ├── revalidate/                 Fires the Next.js webhook on publish
│   │   └── health/                     Liveness + readiness (Mongo ping)
│   └── shared/
│       ├── mail/                       Resend adapter + React Email templates
│       ├── turnstile/                  Cloudflare Turnstile verification
│       └── slug/                       Slugify + uniqueness
├── test/                               Supertest e2e against mongodb-memory-server
└── ...config
```

**Module convention.** Every module is `x.module.ts` · `x.controller.ts` · `x.service.ts` ·
`dto/` (class-validator + Zod) · `schemas/x.schema.ts` (Mongoose) · `x.controller.spec.ts` ·
`x.service.spec.ts`. Controllers stay thin — validate, delegate, shape the response. Services hold
the logic. Mongoose models are injected, never imported globally. **No business logic in
controllers** — a Sonar-visible smell and a testability killer.

### 3.4 Shared packages

| Package            | Contents                                                                                                                                                                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/types`   | Section-key union + per-section field contracts, DTOs, enums (`PostStatus`, `EnquiryStatus`, `UserRole`, `PageKey`), API response envelopes. **Imported by all three apps** — one contract, no drift.                                                                      |
| `packages/ui`      | Brand tokens (CSS vars + Tailwind theme), the skeleton primitives (§7.5), `WaveDivider`, `Button`, `Card`, `Chip`, and the icon set. Shared between web and admin only where genuinely identical — deliberate twins are declared to Sonar (§7.3) rather than force-merged. |
| `packages/config`  | `eslint-preset.mjs` (base · next · nest), `tsconfig.base.json`, `tailwind-preset.ts`, `prettier.config.mjs`.                                                                                                                                                               |
| `packages/testing` | Vitest/Jest setup files, `mongodb-memory-server` harness, entity factories, MSW handlers, custom matchers (including the contrast matcher).                                                                                                                                |

---

## 4. Data model (MongoDB)

All collections carry `createdAt` / `updatedAt`. All writes by an authenticated user carry
`updatedBy`. Ids are Mongo `ObjectId`, exposed as strings.

### 4.1 `pageSections` — the CMS core

The section **registry** lives in `packages/types` as code. Mongo stores only the _values_.

```ts
{
  _id, page: PageKey,          // 'home' | 'about' | 'about/our-story' | … (fixed union)
  key: SectionKey,             // 'hero' | 'why-cards' | 'values-tiles' | … (fixed union)
  order: number,               // code-owned; seeded, never editable through the API
  data: Record<string, unknown>,  // validated against the registry schema for `key`
  updatedBy, updatedAt
}
```

Compound unique index on `{ page, key }`. `POST` is seed-only. `PATCH /content/:page/:key` is the
only mutation the admin can perform, and its body is validated against the registry entry — an
unknown field, a wrong type, a 5-item array where the schema says 4, all rejected with 422.

Worked example — the Home page registry:

| Key                | Component           | Editable fields                                                                                                   |
| ------------------ | ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `hero`             | `Hero`              | eyebrow, heading, subheading, primaryCta{label,href}, secondaryCta{label,href}, image{mediaId,alt}, trustChips[4] |
| `welcome`          | `WelcomeStrip`      | heading, body, link{label,href}                                                                                   |
| `why-cards`        | `WhyCards`          | eyebrow, heading, cards[4]{icon, title, body}                                                                     |
| `level-cards`      | `LevelCards`        | heading, levels[]{name, blurb, icon}, cta{label,href}                                                             |
| `values-tiles`     | `ValuesTiles`       | heading, tiles[7]{letter, name, body}, cta{label,href}                                                            |
| `principal-teaser` | `PrincipalTeaser`   | portrait{mediaId,alt}, quote, name, role, cta{label,href}                                                         |
| `instagram`        | `InstagramShowcase` | heading, handle                                                                                                   |
| `cta-banner`       | `CtaBanner`         | heading, body, primaryCta, secondaryCta                                                                           |

Same treatment for the other seven pages: `about` (4 sub-pages), `academics` (+2), `admissions`,
`student-life`, `contact`, `faqs`. `docs/content-model.md` documents the full registry; the registry
file itself is the executable source of truth and the admin form generator reads it directly, so the
form and the validator can never disagree.

### 4.2 Other collections

| Collection       | Shape                                                                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `posts`          | title, slug (unique), excerpt, bodyMarkdown, cover{mediaId, alt}, category (`news`\|`events`\|`learning`), status (`draft`\|`published`), publishedAt, authorId, seo{title, description, ogImageId}, readingMinutes |
| `faqs`           | group (`admissions`\|`curriculum`\|`school-life`\|`practical`), question, answer (markdown), order, published                                                                                                       |
| `enquiries`      | name, email, phone, topic, childLevel, message, consent, status (`new`\|`read`\|`replied`\|`archived`), notes[], meta{ipHash, userAgent, turnstilePassed}, emailDelivery{sentAt, providerId, error}                 |
| `media`          | publicId, url, width, height, format, bytes, alt **(required)**, folder, uploadedBy, `depictsPupils`, `consentOnFile`, `consentRef`                                                                                 |
| `instagramTiles` | mediaId, caption, href, order, published                                                                                                                                                                            |
| `settings`       | Singleton. contact{phones[], email, address, gpsCode, mapEmbed}, hours, socials{instagram, …}, seoDefaults{titleTemplate, description, ogImageId}, admissionFormUrl, footerNote, announcementBanner                 |
| `users`          | email (unique), passwordHash (argon2id), displayName, role (`admin`\|`editor`), status (`active`\|`suspended`), lastLoginAt, passwordChangedAt, failedAttempts, lockedUntil                                         |
| `refreshTokens`  | userId, tokenHash, family, expiresAt, revokedAt, replacedBy, userAgent, ipHash                                                                                                                                      |
| `revisions`      | entity{type, id}, version, snapshot, createdBy, createdAt, note                                                                                                                                                     |
| `auditLogs`      | actorId, action, entity{type, id}, diff{before, after}, ipHash, createdAt — **append-only**, no update or delete route exists                                                                                       |

**Indexes:** `posts` → `{slug:1}` unique, `{status:1, publishedAt:-1}`, `{category:1, publishedAt:-1}`;
`pageSections` → `{page:1, key:1}` unique, `{page:1, order:1}`; `enquiries` → `{status:1, createdAt:-1}`;
`auditLogs` → `{createdAt:-1}`, `{entity.type:1, entity.id:1}`; `refreshTokens` → TTL on `expiresAt`;
`revisions` → `{entity.type:1, entity.id:1, version:-1}`.

---

## 5. API surface

Base `/api/v1`. Public reads are unauthenticated and cached; everything else is JWT + role gated.
OpenAPI generated by `@nestjs/swagger`, served at `/api/docs` in non-production.

### 5.1 Public

```
GET  /content/:page                     Sections for a page, ordered, published values
GET  /posts?category=&page=&pageSize=   Published only, newest first
GET  /posts/:slug                       Published only; 404 otherwise
GET  /posts/:slug/related               3 by category, excluding self
GET  /faqs                              Grouped, published
GET  /instagram                         Published tiles, ordered
GET  /settings/public                   Contact block, socials, SEO defaults, PDF url
POST /enquiries                         Rate-limited, Turnstile + honeypot verified
GET  /health  ·  GET /health/ready
```

### 5.2 Authenticated

```
POST   /auth/login  ·  /auth/refresh  ·  /auth/logout
POST   /auth/password/forgot  ·  /auth/password/reset
GET    /auth/me  ·  POST /auth/password/change

GET    /admin/posts  ·  POST /admin/posts  ·  GET|PATCH|DELETE /admin/posts/:id
POST   /admin/posts/:id/publish  ·  /unpublish
GET    /admin/content/:page  ·  PATCH /admin/content/:page/:key
GET    /admin/faqs  ·  POST  ·  PATCH|DELETE /admin/faqs/:id  ·  POST /admin/faqs/reorder
GET    /admin/enquiries  ·  GET|PATCH /admin/enquiries/:id
POST   /admin/media/sign  ·  GET /admin/media  ·  PATCH|DELETE /admin/media/:id
GET    /admin/instagram  ·  POST  ·  PATCH|DELETE /admin/instagram/:id  ·  POST /reorder
GET|PATCH /admin/settings
GET    /admin/revisions/:type/:id  ·  POST /admin/revisions/:type/:id/restore/:version
GET    /admin/audit
GET    /admin/users  ·  POST  ·  PATCH|DELETE /admin/users/:id      (admin role only)
GET    /admin/overview                  Dashboard KPIs
```

Every mutating route: audited, rate-limited, and — where it changes published output — fires the
revalidation webhook with the affected cache tags.

---

## 6. Cross-cutting behaviour

### 6.1 Contact form (Build Package §5.1)

Fields, validation and copy exactly as specced. Flow: browser → `POST /api/enquiry` (Next route
handler, keeps the Turnstile secret server-side) → `POST /api/v1/enquiries` (Nest) → verify honeypot

- Turnstile → persist → **Resend**: notification to the school (`reply-to` = the parent, subject
  `New enquiry from {name} — {topic}`) and a branded auto-reply to the parent.

Success: playful confetti/sparkle + _"Thank you! Your message has reached the Kedland team. We'll be
in touch very soon. 🌟"_, form cleared. Failure: friendly error **plus the school's phone numbers as
a fallback**. `aria-live` status region; labels tied to inputs; keyboard-complete.
**The enquiry is persisted before the email is attempted** — a Resend outage loses nothing, and the
inbox in the dashboard is the safety net.

### 6.2 Admission form (§5.2)

Static PDF at `/assets/forms/kedland-admission-form.pdf`, URL held in `settings` so it can be swapped
without a deploy. Prominent download button on `/admissions`. Analytics event on download.
`[PENDING — client: supply the PDF]`.

### 6.3 Instagram showcase (§5.3)

Curated static grid of 4–6 of the school's **own** post images, managed through the dashboard
(`instagramTiles`), each linking out to the profile or the specific post, plus a
**[Follow us on Instagram]** button → [@kedlandintlschool](https://www.instagram.com/kedlandintlschool).
Lazy-loaded, never render-blocking. **No Graph API, no tokens, no paid widget, no auto-sync** — as
specced. No Business/Creator account needed.

### 6.4 Blog (§4.6, §5.4)

**List** — responsive card grid (cover, title, date, one-line excerpt, category tag), newest first,
rounded cards, hover lift, load-more, optional category filter. Empty state: _"New stories coming
soon — follow us on Instagram!"_

**Post** — cover + title + date; markdown rendered to sanitised HTML (`remark` → `rehype` →
`rehype-sanitize` with a strict allowlist matching exactly what the editor can produce); headings,
paragraphs, bold/italic, lists, links, inline images, quote blocks; back-to-news; **share buttons —
WhatsApp, Facebook, X, LinkedIn, copy-link**; related posts; generous measure and line-height.
`Article` JSON-LD; Open Graph image = cover.

**Editor** — TipTap with a toolbar limited to exactly the allowed marks and nodes, serialising to
markdown on save. Drag-and-drop or click image upload → Cloudinary via signed upload → auto-resize
and optimise → inserted at the cursor with an **alt-text prompt that cannot be skipped**. Autosave
draft every 30s. Slug auto-generated from the title, editable, uniqueness-checked live.

### 6.5 SEO

Per-page `title` + `description` from the CMS via `generateMetadata`, seeded with the §4 values.
Open Graph + Twitter cards. JSON-LD: `EducationalOrganization` on Home and Contact (name, logo,
address, phones, geo, `sameAs` → Instagram), `FAQPage` on `/faqs`, `Article` per post,
`BreadcrumbList` on nested routes. `sitemap.ts` and `robots.ts` generated from live routes + posts.
Favicon block per build-package §6.5. Google Search Console + Cloudflare Web Analytics or Plausible
`[PENDING — client preference]`.

### 6.6 Performance budget

Self-hosted subset fonts with `swap` · `next/image` with AVIF/WebP, `sizes`, explicit dimensions,
lazy below fold · statically rendered pages · route-level code splitting · no client JS on pages
that don't need it (the header, forms, accordions and the IG grid are the only client components).
**Targets: Lighthouse ≥ 90 across the board · LCP < 2.5s on a throttled 3G profile · CLS < 0.1 ·
first-load JS ≤ 130 KB per route.** Enforced by a Lighthouse CI budget in the pipeline — a
regression fails the build, it does not merely warn.

### 6.7 Security

HTTPS only · Helmet with a CSP allowing only Cloudinary, Turnstile, the analytics origin and self ·
HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` · CORS allowlist (no `*`) ·
argon2id passwords with a strong-password policy · JWT access 15m + rotating refresh 7d in an
httpOnly, Secure, SameSite=Lax cookie, with reuse detection · `@nestjs/throttler` globally, tightened
on `/auth/login` and `/enquiries` · Zod-validated env, process refuses to boot without it · secrets
only in the platform's env store, never in the repo (`.env.example` documents names only) ·
markdown sanitised on render · no `dangerouslySetInnerHTML` outside the single audited post-body
renderer · dependency and secret scanning in CI.

### 6.8 Accessibility & compliance

**WCAG 2.1 AA is a merge gate, not an aspiration.** Semantic landmarks, one `h1` per page, ordered
headings, labelled form controls, `alt` on every image (schema-enforced), visible focus states,
skip-link, keyboard-complete navigation and dropdowns, `prefers-reduced-motion` honoured, contrast
per §2.2. Verified by `eslint-plugin-jsx-a11y` (lint), `axe-core` assertions on every page (e2e), and
a manual keyboard pass per page before sign-off.
Contact-form consent checkbox + a **Privacy Notice** page `[PENDING — client: approve]`.
Pupil-image consent enforced in the media schema (§2.5).

---

## 7. Quality gates

Every gate below runs in CI and **blocks the merge**. None of them is advisory.

### 7.1 TypeScript

`strict: true` plus `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`,
`exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `verbatimModuleSyntax`.
**`any` is banned** (`@typescript-eslint/no-explicit-any` as an error); `unknown` + a narrowing guard
is the answer. Shared base config in `packages/config/tsconfig.base.json`; each app extends it.

### 7.2 Linting — from commit one

ESLint 9+ flat config, composed presets in `packages/config`:

- `@eslint/js` recommended + `typescript-eslint` **strict-type-checked** and **stylistic-type-checked**
- **`eslint-plugin-sonarjs`** — catches the same smells Sonar will, at the keyboard instead of in CI
- `eslint-plugin-jsx-a11y` (a11y, error-level) · `eslint-plugin-react-hooks` · `@next/eslint-plugin-next`
- `eslint-plugin-import` — ordered imports, no cycles, no unresolved
- `eslint-plugin-security` (api) · `eslint-plugin-vitest` / `eslint-plugin-jest` on tests
- **Custom rule: no raw colour literals** — hex, `rgb()`, `hsl()` outside `packages/ui/src/styles`
  fail the lint. Tokens or nothing.
- Prettier for formatting, `eslint-config-prettier` to stand down on style rules

`husky` + `lint-staged` run `eslint --fix` and `prettier --write` on staged files pre-commit;
`commitlint` enforces Conventional Commits. **`--max-warnings=0`** in CI: a warning is an error.

### 7.3 SonarQube

`sonar-project.properties` at the root, multi-module. Quality gate on the **default "Sonar way" plus
project overrides**, and the pipeline fails on a red gate.

```properties
sonar.projectKey=kedland
sonar.projectName=Kedland International School
sonar.sources=apps/web/src,apps/admin/src,apps/api/src,packages/*/src
sonar.tests=apps/web/src,apps/admin/src,apps/api/src,apps/api/test,apps/web/e2e,apps/admin/e2e
sonar.test.inclusions=**/*.spec.ts,**/*.spec.tsx,**/*.test.ts,**/*.test.tsx,**/e2e/**
sonar.exclusions=**/node_modules/**,**/.next/**,**/dist/**,**/coverage/**,**/*.config.*,**/seeds/**
sonar.javascript.lcov.reportPaths=apps/web/coverage/lcov.info,apps/admin/coverage/lcov.info,apps/api/coverage/lcov.info
sonar.typescript.tsconfigPath=tsconfig.base.json
sonar.sourceEncoding=UTF-8
```

Standing rules the team writes to, because these are what fail this kind of project:

- **Cognitive complexity ≤ 15** per function — extract, don't nest. Section components stay dumb;
  branching lives in the resolver.
- **No duplicated blocks.** Web and admin are separate apps; genuine, intentional twins (the API
  client shape, the auth context, the skeleton primitives) either move into `packages/` or get
  declared in `sonar.cpd.exclusions` **with a comment explaining why** — never left silently.
- No nested ternaries · no commented-out code · no `TODO` without a ticket reference ·
  no hardcoded credentials or URIs · no unused imports, variables or parameters ·
  no `console.*` outside the logger · every `switch` has a `default`.
- Security hotspots reviewed and dispositioned, not dismissed in bulk.

### 7.4 Testing — 80%+ coverage, enforced

| Layer           | Tool                                               | What it covers                                                                                                                                                                                       |
| --------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API unit        | **Jest** (Nest default)                            | Services with mocked Mongoose models: content validation, slug uniqueness, publish transitions, revision snapshots, role guards, consent gate, Turnstile verification, mail-failure isolation        |
| API integration | **Jest + Supertest + `mongodb-memory-server`**     | Every route: auth, validation rejects (422 shapes), pagination, filtering, ownership, rate limits, audit rows written, real Mongo indexes                                                            |
| Web/admin unit  | **Vitest + React Testing Library**                 | Every section component against its schema, skeleton parity, form validation, the markdown renderer's sanitiser, hooks, the section resolver's fallbacks                                             |
| Contract        | **Vitest**                                         | `packages/types` schemas round-trip the seed data — the guard against API/UI drift                                                                                                                   |
| Accessibility   | **axe-core** in RTL + Playwright                   | Zero violations per page and per interactive component                                                                                                                                               |
| E2E             | **Playwright** (Chromium, WebKit, mobile viewport) | Parent journeys: browse → enquire → download form; staff journeys: login → write post → upload image → publish → verify live; edit page copy → verify live; keyboard-only navigation; reduced-motion |
| Visual          | **Playwright screenshots**                         | Header (all breakpoints), footer, hero, honeycomb, values tiles — the design-critical surfaces                                                                                                       |
| Budget          | **Lighthouse CI**                                  | The §6.6 numbers, as assertions                                                                                                                                                                      |

**Thresholds are configured, not aspirational** — `coverageThreshold` in the Jest config and
`coverage.thresholds` in each Vitest config, all set to **80% statements / branches / functions /
lines**, with the API's `modules/**` held to **85%**. Below threshold, the test command exits
non-zero and CI fails. Sonar independently gates **80% coverage on new code**.

Conventions: tests colocated as `*.spec.ts(x)` next to the unit; shared factories and fixtures in
`packages/testing`; **no snapshot tests of whole components** (they rot and assert nothing) — assert
behaviour and accessible roles instead; every bug fix ships with the regression test that would have
caught it.

### 7.5 Skeleton loading — the default, everywhere

**Rule: no spinners.** Every loading state is a shape-stable skeleton that matches the final layout's
dimensions, so nothing shifts when the content lands (this is also how CLS < 0.1 is won).

- `packages/ui/src/skeleton` exports `Skeleton`, `SkeletonGroup`, `SkeletonText`, `SkeletonCard`,
  `SkeletonTable`, `BusyLabel` — the accessible pattern from the oguaaman admin: the wrapper carries
  `role="status" aria-live="polite" aria-busy="true"` plus an `sr-only` label; the shapes themselves
  are `aria-hidden`. A screen reader hears _"Loading news"_, not thirty empty rectangles.
- **Web:** a `loading.tsx` at every route segment, plus `<Suspense>` boundaries around any section
  whose data is slower than the shell — the page frame paints instantly.
- **Admin:** a `PageSkeleton` on route transitions in the dashboard layout (as in oguaaman's shell),
  table-body skeletons for in-place refreshes, and `BusyLabel` on buttons — the button keeps its
  width, so the toolbar never jumps.
- **Every skeleton is tested** for shape parity with the component it stands in for. A skeleton that
  drifts from its component is a CLS bug waiting to ship.
- Reduced-motion disables the shimmer animation; the shapes remain.

---

## 8. Build order

Each phase ends green: lint clean, coverage above threshold, Sonar gate passing, and — from Phase 1
on — deployed to a preview URL.

**Phase 0 — Foundation**
`git init`, remote `git@github.com:stanleyHayes/kedland.git`, `main` protected + `develop`.
pnpm workspace, Turborepo, the three app scaffolds and four packages. **ESLint, Prettier, TS strict,
husky, lint-staged, commitlint, the Jest/Vitest/Playwright harnesses, `sonar-project.properties` and
the CI workflow all land in this phase, before the first feature commit.** Docker Compose for local
Mongo. `.env.example`. Health check green end to end.
_Exit: an empty app passes every gate._

**Phase 1 — Design system + shell**
Brand tokens → Tailwind theme. Fonts self-hosted. `packages/ui` primitives + the full skeleton set +
the contrast test. `WaveDivider` and the blob/spot-art library. **The variant-4 header** (§2.6) with
its dropdowns, quick-links panel and mobile menu, plus the footer — both fully responsive,
keyboard-complete and axe-clean, with visual snapshots at every breakpoint.

**Phase 2 — API foundation**
Nest boot, Mongo connection, config validation, global filters/interceptors/guards, Helmet, CORS,
throttling, the audit and revision modules, health endpoints, Swagger. Auth: login, refresh
rotation, logout, password reset, roles. The seed command with the first admin user.

**Phase 3 — Content model + seed**
The section registry in `packages/types`. The `content` module with per-key validation. **Seed every
word of build-package §4** into `pageSections`, `faqs`, `settings` and `instagramTiles`. Contract
tests prove the seed satisfies the schemas. _This is the phase that makes the copy real — no
paraphrasing, no improving. The §4 text is what goes in the database._

**Phase 4 — Public site**
All eight pages built section-by-section from the registry, statically rendered with tagged fetches.
The EYFS honeycomb rendered inline and responsive **with the seven descriptions as real HTML text**,
not baked into the SVG. Subject cards, values tiles, level cards, the day timeline, the FAQ
accordion with `FAQPage` JSON-LD. Skeletons and `loading.tsx` throughout. SEO, sitemap, robots, OG.

**Phase 5 — Contact + admissions**
The enquiry form with Turnstile, honeypot, consent and the a11y contract. Resend integration, both
emails, delivery persisted. The admissions download block and the fees copy. Map embed.
DNS records — **SPF (one combined record, Workspace + Resend), DKIM for both, DMARC** — documented
in the runbook and verified before launch.

**Phase 6 — Blog**
Posts module, slugs, draft/publish, revisions. Public list + post pages, share buttons, related
posts, empty state, `Article` JSON-LD. The TipTap editor with the constrained toolbar, markdown
serialisation, Cloudinary signed upload with the mandatory alt prompt, autosave. Revalidation
webhook proven: publish → live within seconds.

**Phase 7 — Dashboard**
The full shell (sidebar, groups, collapse, header, context help, user menu, first-login tour).
Overview KPIs. Posts management. **Content editing** — schema-generated forms with live preview and
the revision drawer. FAQs, Instagram tiles, media library with the consent gate, enquiry inbox,
settings, users, audit log. The in-app help page.

**Phase 8 — Hardening**
Full a11y pass (automated + manual keyboard). Lighthouse CI budgets met on real hardware profiles.
Coverage to target across all three apps. Sonar gate green with zero unreviewed hotspots.
Security headers verified. Load a realistic content volume. Error and empty states everywhere.

**Phase 9 — Launch**
Domain `kedland.edu.gh` → DNS, HTTPS forced, www → apex. Production env in each platform. Atlas
backups + a **tested restore**. Search Console + analytics. Seed the real content and swap every
`[PLACEHOLDER]` that has arrived. Handover: repo access, credentials, `docs/admin-guide.md`, a live
walkthrough with the school's team. 30 days post-launch support, care plan from day 31.

---

## 9. Environments & operations

### 9.1 Deployment

| Service      | Platform                      | Domain                          |
| ------------ | ----------------------------- | ------------------------------- |
| `apps/web`   | Vercel                        | `kedland.edu.gh` + `www` → apex |
| `apps/admin` | Vercel                        | `admin.kedland.edu.gh`          |
| `apps/api`   | **Render Blueprint** (Docker) | `api.kedland.edu.gh`            |
| Database     | MongoDB Atlas                 | —                               |
| Media        | Cloudinary                    | —                               |
| Mail         | Resend                        | —                               |
| Spam         | Cloudflare Turnstile          | —                               |

`main` → production, every PR → preview (web and admin previews point at a staging API and a staging
Atlas database, never production).

### 9.2 Render Blueprint (`render.yaml`)

The API is **not** clicked together in the Render dashboard. The service, its Docker build, its
health check, its region and its complete environment contract live in `render.yaml` at the repo
root — so infrastructure changes arrive as reviewable diffs in a PR, and a fresh environment is
reproducible from the repo alone.

**Deploy:** Render dashboard → New → Blueprint → pick the repo. Render reads the file, builds
`apps/api/Dockerfile`, and prompts once for every `sync: false` secret.

```yaml
services:
  - type: web
    name: kedland-api
    runtime: docker
    dockerfilePath: ./apps/api/Dockerfile
    dockerContext: . # monorepo root — the build needs packages/*
    plan: starter # see the free-tier note below
    region: frankfurt # closest Render region to Ghana
    healthCheckPath: /api/v1/health
    autoDeployTrigger: commit
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI # Atlas mongodb+srv:// URI
        sync: false
      - key: MONGODB_DB
        value: kedland
      - key: JWT_ACCESS_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true
      - key: CORS_ORIGINS # keep in sync with the Vercel domains
        value: https://kedland.edu.gh,https://www.kedland.edu.gh,https://admin.kedland.edu.gh
      - key: PUBLIC_API_URL
        value: https://api.kedland.edu.gh
      # Media — Cloudinary signed uploads. Render's disk is ephemeral, so
      # nothing durable is ever written to the container filesystem.
      - key: CLOUDINARY_CLOUD_NAME
        sync: false
      - key: CLOUDINARY_API_KEY
        sync: false
      - key: CLOUDINARY_API_SECRET
        sync: false
      # Mail — enquiry notification + parent auto-reply.
      - key: RESEND_API_KEY
        sync: false
      - key: MAIL_FROM
        value: Kedland International School <noreply@kedland.edu.gh>
      - key: MAIL_TO_SCHOOL # PENDING — client's Workspace address
        sync: false
      # Spam — Cloudflare Turnstile server-side verification.
      - key: TURNSTILE_SECRET_KEY
        sync: false
      # Publish → cache purge on the public site.
      - key: REVALIDATE_WEBHOOK_URL
        value: https://kedland.edu.gh/api/revalidate
      - key: REVALIDATE_SECRET
        generateValue: true
      # First admin account, consumed once by the seed command.
      - key: SEED_ADMIN_EMAIL
        sync: false
      - key: SEED_ADMIN_PASSWORD
        sync: false
```

**Notes carried into `docs/runbook.md`:**

- **Plan.** Render's free tier sleeps after ~15 minutes idle and takes ~50s to wake. The public site
  is statically rendered so a sleeping API never affects a parent browsing pages — but it _would_
  stall the enquiry form and the dashboard login. **Budget for `starter`.** If free is required for
  a staging environment, note that the first enquiry after a nap is slow and keep the phone-number
  fallback copy prominent (§6.1). `[PENDING — client: confirm the hosting budget line]`
- **Ephemeral disk.** No uploads, no generated files, no SQLite-style state on the container. All
  media goes to Cloudinary; all state is in Atlas. Nothing to lose on redeploy.
- **`generateValue: true`** for JWT and webhook secrets — Render mints them once on first deploy.
  Rotating `JWT_*` invalidates every live session (acceptable, 2–3 staff); rotating
  `REVALIDATE_SECRET` requires updating the matching Vercel env in the same change window.
- **`REVALIDATE_SECRET` and `CORS_ORIGINS` are the two values that must stay in lockstep** with the
  Vercel projects. A change to either is a two-sided deploy — called out in the runbook.
- **Preview/staging** runs from the same blueprint with `previewsEnabled`, pointing at a separate
  Atlas database. Preview services never receive the production Atlas URI.
- Only `$PORT` is public; the container exposes nothing else.

### 9.3 CI (`.github/workflows/ci.yml`)

`install (pnpm cache)` → `lint --max-warnings=0` → `typecheck` → `test --coverage` →
`build` → `e2e (Playwright)` → `lighthouse-ci` → `sonar-scan`. Turborepo `--affected` on PRs, full
run on `main`. Dependency review and secret scanning on every PR. **A red Sonar gate, a coverage
miss, or a blown performance budget fails the build.**

### 9.4 Environment variables

Documented by name in `.env.example`, validated by Zod at boot, never committed. The API's
production values are declared in `render.yaml` (§9.2); the two Next apps' are set per-project in
Vercel. `.env.example` stays the canonical list of _names_ for local development.

```
# api
NODE_ENV  PORT  MONGODB_URI  CORS_ORIGINS
JWT_ACCESS_SECRET  JWT_REFRESH_SECRET  JWT_ACCESS_TTL  JWT_REFRESH_TTL
CLOUDINARY_CLOUD_NAME  CLOUDINARY_API_KEY  CLOUDINARY_API_SECRET
RESEND_API_KEY  MAIL_FROM  MAIL_TO_SCHOOL
TURNSTILE_SECRET_KEY
REVALIDATE_WEBHOOK_URL  REVALIDATE_SECRET
SEED_ADMIN_EMAIL  SEED_ADMIN_PASSWORD

# web
NEXT_PUBLIC_SITE_URL  NEXT_PUBLIC_API_URL  API_INTERNAL_URL
NEXT_PUBLIC_TURNSTILE_SITE_KEY  TURNSTILE_SECRET_KEY
REVALIDATE_SECRET  NEXT_PUBLIC_ANALYTICS_ID

# admin
NEXT_PUBLIC_API_URL  NEXT_PUBLIC_SITE_URL  SESSION_SECRET
```

### 9.5 Runbook (`docs/runbook.md`)

Deploy and rollback per service · **changing the blueprint and re-syncing Render** · Atlas backup
schedule and the **tested** restore procedure · rotating a leaked secret (including the two-sided
`REVALIDATE_SECRET` / `CORS_ORIGINS` window) · DNS and mail-deliverability checks (SPF/DKIM/DMARC) ·
what to do when Resend, Cloudinary or Atlas is down · resetting a locked staff account · restoring a
content revision · the on-call contact for the care plan.

---

## 10. Implementation ledger

_Single source of truth for what is done. Update on every ship.
Statuses: ✅ done · ◐ partial (what remains, in italics) · ☐ not started._

| Phase | Item                                                                           | Status |
| ----- | ------------------------------------------------------------------------------ | ------ |
| 0     | Repo, workspace, Turborepo                                                     | ✅     |
| 0     | ESLint · Prettier · TS strict · husky · commitlint                             | ✅     |
| 0     | Jest · Vitest · Playwright harnesses + coverage thresholds                     | ✅     |
| 0     | `sonar-project.properties` + CI workflow                                       | ✅     |
| 0     | `render.yaml` Blueprint + `apps/api/Dockerfile`                                | ✅     |
| 1     | Brand tokens · fonts · `packages/ui` · skeletons                               | ✅     |
| 1     | Header (variant 4) · dropdowns · quick links · mobile menu                     | ✅     |
| 1     | Footer · wave dividers · spot art                                              | ✅     |
| 2     | Nest foundation · config · guards · filters · audit · revisions                | ✅     |
| 2     | Auth (login, refresh rotation, reset, roles)                                   | ✅     |
| 3     | Section registry (`packages/types`)                                            | ✅     |
| 3     | `content` module + per-key validation                                          | ✅     |
| 3     | Seed: all §4 copy, FAQs, settings, IG tiles, admin user                        | ✅     |
| 4     | Home · About (+4) · Academics (+2) · Admissions · Student Life · FAQs          | ☐      |
| 4     | EYFS honeycomb (inline, responsive, text-as-HTML)                              | ☐      |
| 4     | SEO · JSON-LD · sitemap · robots · OG                                          | ☐      |
| 5     | Enquiry form · Turnstile · Resend · auto-reply                                 | ☐      |
| 5     | Admissions download · map · DNS mail records                                   | ☐      |
| 6     | Posts module · public list + post · share · related                            | ☐      |
| 6     | TipTap editor · markdown · Cloudinary upload · autosave                        | ☐      |
| 6     | Revalidation webhook                                                           | ☐      |
| 7     | Dashboard shell · overview · posts · content editor                            | ☐      |
| 7     | FAQs · media (consent gate) · Instagram · enquiries · settings · users · audit | ☐      |
| 8     | A11y pass · Lighthouse budgets · coverage · Sonar green                        | ☐      |
| 9     | Domain · production env · backups + restore test · handover                    | ☐      |

**Latest delivery — 2026-07-26:** Redesigned the complete About family (`/about` plus Our Story,
Mission/Vision/Values, Principal and Facilities). Added a shared About route hub, page-specific hero
watermarks, editorial story and Principal treatments, and a responsive facilities card grid with
meaningful icon watermarks. Production build, focused component tests and desktop/mobile route checks
are green; final facilities photography remains on the school punch list. Refined the global header
logo panel to match the supplied reference silhouette: compact left corners, a straight extended top,
and one continuous inward sweep at the lower-right.

**Homepage follow-up — 2026-07-26:** Added a concise six-route “Explore Kedland” guide linking Early
Years, Primary, Student Life, Facilities, News and Admissions. Rebuilt the homepage Principal teaser
as a real portrait-led editorial card and removed the crest from every Principal-photo position. The
approved portrait will be picked up automatically from `apps/web/public/images/principal-mary.*` when
the parallel media pass supplies it; until then the UI labels the image as pending rather than
misrepresenting the school logo as a person.

**Landing motion follow-up — 2026-07-26:** Gave the homepage hero a focused text-animation sequence:
the eyebrow settles in, headline words rise in with a short stagger, “shine” receives a branded colour
sweep and drawn underline, and a small Learn · Play · Shine rhythm continues quietly. The whole
sequence becomes static under `prefers-reduced-motion`, preserving the complete accessible `h1`.

---

## 11. Punch list — owed by the school

Carried from build-package §8. The 14-day content window runs against this; chase it in parallel with
Phases 0–4 so nothing blocks launch.

**People & photos**

- [x] Principal — name (Mary), title, sign-off. Logo used as portrait for now.
- [ ] Real photo of Mary _(optional, replaces the logo placeholder)_.
- [ ] Staff/leadership to feature: names, roles, photos, short bios — or "none for now".
- [ ] Professional photography of pupils, classrooms, facilities, activities _(recommend a half-day shoot)_.
- [ ] ⚠️ **Written parental consent** confirmed for every real pupil photo used publicly. **Blocking** — the media API rejects uncleared pupil images.

**Facts & policies**

- [ ] Exact levels/ages open this academic year (confirm Primary 1–3; ages per level).
- [ ] Admissions: required documents, return method, intake (rolling/termly), term dates, whether an assessment applies.
- [x] Fees — decided: not published; parents contact the school.
- [ ] School hours · after-school & weekend details · uniform confirmation · full extracurricular list.
- [ ] Facilities final list + photos.
- [ ] Safeguarding wording approval + any policy PDF to link.

**Contact & digital**

- [ ] Official school email (once Google Workspace is live) — the enquiry destination. **Blocking for Phase 5.**
- [ ] Exact street address + Ghana Post GPS code and the precise map pin.
- [x] Instagram handle confirmed: [@kedlandintlschool](https://www.instagram.com/kedlandintlschool). Other socials `[PENDING]`.
- [ ] Admission form PDF — supply, or approve XCreativs to design one.
- [ ] Approve Privacy Notice copy.
- [ ] Confirm reversed/white logo need, or approve XCreativs to produce one.

**Already provided, no action:** About · Mission · Vision · Motto · Values (KEDLAND) · Principal's
message · Student Life notes · curriculum (EYFS + Cambridge subjects) · level list & services ·
public phone numbers · location area · logo.

---

## 12. Open questions for XCreativs

None blocking. Resolve before the phase in brackets.

1. **Analytics provider** — Cloudflare Web Analytics or Plausible? [Phase 4]
2. **Reversed logo** — produce one in-house, or wait on the client? Affects the footer sticker and dark bands. [Phase 1]
3. **Auto-reply copy** — needs a written, approved version in the school's voice. [Phase 5]
4. **Post categories** — is News · Events · Learning final, or should the school be able to add categories? _(Current plan: fixed union — adding categories means a deploy, which is the right trade for three staff.)_ [Phase 6]
5. **Staff accounts** — how many, and which named people? Drives the seed. [Phase 2]
6. **Care plan** — who swaps the Instagram tiles monthly, and is that in scope from day 31? [Phase 9]
7. **Render plan** — `starter` is assumed (§9.2). Free-tier sleep would stall the enquiry form and dashboard login by ~50s after idle. Needs a budget confirmation. [Phase 0]

---

_Prepared by XCreativs Technologies — Intelligent Digital Systems Company.
Confidential; for the Kedland International School engagement and its build team._
