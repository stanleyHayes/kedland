# Architecture

> Summary. The full reasoning lives in [`../agent_plan.md`](../agent_plan.md) §3–§6.

## Shape

Three deployables and four shared packages in one pnpm workspace.

```
Parent's browser ──▶ apps/web (Vercel, statically rendered)
                          │ tagged fetch, revalidated on publish
                          ▼
Staff browser ─────▶ apps/api (Render) ──▶ MongoDB Atlas
        │                 │
        │                 ├──▶ Cloudinary  (media)
        └──▶ apps/admin   └──▶ Resend      (enquiry mail)
             (Vercel)
```

**A parent's request never touches MongoDB.** Public pages are Server Components rendered at build
and served from the edge; publishing content calls a webhook that runs `revalidateTag`, the page
regenerates once, then serves static again. Only the enquiry form is dynamic.

## Why the apps are separate

`apps/admin` is its own Next application rather than a route group, so dashboard code never ships in
the bundle a parent downloads, the two deploy independently, sessions live in separate cookie
scopes, and SonarQube sees a real module boundary.

## The content model

Page structure is code (`packages/types/src/content/registry.ts`); page _values_ are MongoDB. An
editor changes words and pictures inside a section. Adding, removing or reordering a section is a
pull request. This is the whole reason a CMS is safe here — see
[`content-model.md`](content-model.md) and `agent_plan.md` §0.2.

## Shared packages

| Package            | Consumed by    | Purpose                                                |
| ------------------ | -------------- | ------------------------------------------------------ |
| `@kedland/types`   | all three apps | One contract. Enums, envelopes, the section registry.  |
| `@kedland/ui`      | web, admin     | Brand tokens, skeleton primitives, the contrast maths. |
| `@kedland/config`  | all            | ESLint, TypeScript, Prettier presets.                  |
| `@kedland/testing` | all            | Factories, fixtures, the contrast matcher.             |

They are consumed as TypeScript source, not built output — one less build step, and a change in a
package is a type error in its consumers immediately.

## Known constraints

- **TypeScript 6, not 7.** `typescript-eslint` caps at `<6.1`. See the README.
- **`moduleResolution: Node10` in the API.** Node16 enforces the ESM/CJS boundary, and workspace
  packages cross it as raw source. Revisit alongside the TS 7 upgrade — either build the shared
  packages to real `.js` + `.d.ts`, or move the API to ESM.
