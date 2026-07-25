# Kedland International School

Website, back-office dashboard and API for **Kedland International School** — a British-curriculum
early-years and lower-primary school in Community 19 Annex, Lashibi-Tema, Ghana.

> **Read first:** [`agent_plan.md`](agent_plan.md) — architecture, decisions and build order.
> [`Kedland_Website_Build_Package.md`](Kedland_Website_Build_Package.md) — the product spec and the
> **final, approved page copy**. Where the two disagree on technology the plan wins; where they
> disagree on copy, brand or content, **the build package wins, always**.

**Status:** Phase 0 complete — foundation, quality gates and CI. No product features yet.

---

## Quick start

```bash
corepack enable          # pnpm 11
pnpm install
cp .env.example .env     # then fill in the blanks

docker compose up -d     # local MongoDB on :27018
pnpm dev                 # web :3000 · admin :3001 · api :8080
```

Individual apps:

```bash
pnpm --filter @kedland/web dev
pnpm --filter @kedland/admin dev
pnpm --filter @kedland/api dev
```

## Layout

```
apps/
  web/        Next.js — the public site           :3000
  admin/      Next.js — the back-office dashboard :3001
  api/        NestJS  — REST API over MongoDB     :8080
packages/
  types/      Shared contracts + the CMS section registry
  ui/         Brand tokens and shared primitives
  config/     ESLint, TypeScript, Prettier presets
  testing/    Factories, fixtures and custom matchers
```

## Stack

|                         |                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| Public site & dashboard | Next.js 16 (App Router) · React 19 · Tailwind 4                                            |
| API                     | NestJS 11 · Mongoose 9 · MongoDB                                                           |
| Language                | TypeScript 6, strict — see the pin note below                                              |
| Tests                   | Vitest + Testing Library (web/admin) · Jest + Supertest (api) · Playwright + axe (browser) |
| Hosting                 | Vercel (web, admin) · Render Blueprint (api) · MongoDB Atlas · Cloudinary · Resend         |

**Why TypeScript 6 and not 7.** TypeScript 7 is released, but `typescript-eslint` peers
`typescript >=4.8.4 <6.1.0` and `ts-jest` peers `<7`. Type-aware linting is the backbone of the
SonarQube quality gate, and we are not trading it away to sit on the newest compiler. Pinned in
[`pnpm-workspace.yaml`](pnpm-workspace.yaml); revisit when typescript-eslint ships TS 7 support.

## Commands

| Command              | What it does                                               |
| -------------------- | ---------------------------------------------------------- |
| `pnpm dev`           | Every app in watch mode                                    |
| `pnpm build`         | Build everything                                           |
| `pnpm lint`          | ESLint, `--max-warnings=0`                                 |
| `pnpm typecheck`     | `tsc --noEmit` across the workspace                        |
| `pnpm test`          | Unit and integration tests                                 |
| `pnpm test:coverage` | The same, with coverage thresholds enforced                |
| `pnpm test:e2e`      | Playwright, against a built app                            |
| `pnpm format`        | Prettier write                                             |
| **`pnpm verify`**    | **Everything CI runs, in order. Run this before pushing.** |

## Quality gates

None of these are advisory — each one fails the build.

- **TypeScript strict**, plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` and friends.
  `any` is banned; `unknown` with a narrowing guard is the answer.
- **ESLint** with `typescript-eslint` strict-type-checked, `eslint-plugin-sonarjs` (the same smells
  Sonar will flag, caught at the keyboard), `jsx-a11y` at error level, and a custom
  `brand/no-raw-color` rule — colour literals outside the token files fail the lint.
- **80% coverage** minimum, enforced in each runner's config as well as by the Sonar gate. The API's
  `modules/` are held to 85%.
- **Accessibility** is checked three ways: lint, `axe-core` in component and browser tests, and a
  manual keyboard pass before sign-off. WCAG 2.1 AA is a merge gate.
- **Supply chain**: pnpm refuses packages published in the last seven days, refuses non-registry
  transitive sources, and treats a lost provenance attestation as a possible takeover. Every CI
  action is pinned to a commit SHA. Every install script is an explicit allow/deny decision.

Git hooks run `eslint --fix` and Prettier on staged files, and enforce Conventional Commits.

## Conventions

- **No spinners.** Every loading state is a shape-stable skeleton matching the final layout, so
  nothing shifts when content lands. `@kedland/ui` exports the primitives.
- **No colour literals** outside `packages/ui/src/lib/tokens.ts` and its CSS mirror.
- **The section registry owns page structure.** Editors change values inside a section; they cannot
  add, remove or reorder sections. See [`packages/types/src/content/registry.ts`](packages/types/src/content/registry.ts).
- **Tests live beside the code** as `*.spec.ts(x)`. Every bug fix ships with the regression test that
  would have caught it.

## Deployment

| Service      | Platform                                        | Domain                 |
| ------------ | ----------------------------------------------- | ---------------------- |
| `apps/web`   | Vercel                                          | `kedland.edu.gh`       |
| `apps/admin` | Vercel                                          | `admin.kedland.edu.gh` |
| `apps/api`   | Render Blueprint ([`render.yaml`](render.yaml)) | `api.kedland.edu.gh`   |

`main` → production, every PR → preview. Preview builds point at a staging API and a staging Atlas
database, never production.

## Documentation

- [`agent_plan.md`](agent_plan.md) — architecture, decisions, build order, open questions
- [`docs/architecture.md`](docs/architecture.md) — how the pieces fit
- [`docs/content-model.md`](docs/content-model.md) — the section registry, explained
- [`docs/admin-guide.md`](docs/admin-guide.md) — handover guide for the school's team
- [`docs/runbook.md`](docs/runbook.md) — deploy, rollback, restore, incident

---

_Built by XCreativs Technologies for Kedland International School._
