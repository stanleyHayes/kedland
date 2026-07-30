# Runbook

> Phase 0 skeleton. Each section is filled in as the corresponding capability ships.

## Deploy

| Service      | How                                     | Rollback                                                  |
| ------------ | --------------------------------------- | --------------------------------------------------------- |
| `apps/web`   | Push to `main` → Vercel                 | Vercel dashboard → Deployments → Promote a previous build |
| `apps/admin` | Push to `main` → Vercel                 | As above                                                  |
| `apps/api`   | Push to `main` → Render (`render.yaml`) | Render dashboard → Events → Rollback                      |

Changing `render.yaml` requires a Blueprint re-sync in the Render dashboard; it is not picked up by
an ordinary deploy.

## Custom domains

| Host                           | Service     | Platform |
| ------------------------------ | ----------- | -------- |
| `https://kedland.edu.gh`       | Public site | Vercel   |
| `https://admin.kedland.edu.gh` | Dashboard   | Vercel   |
| `https://api.kedland.edu.gh`   | API         | Render   |

Canonical SEO (`metadataBase`, Open Graph, sitemap, robots, JSON-LD) follows
`NEXT_PUBLIC_SITE_URL` on the web project. After DNS is live set:

| Where          | Variable                    | Value                                                              |
| -------------- | --------------------------- | ------------------------------------------------------------------ |
| Vercel → web   | `NEXT_PUBLIC_SITE_URL`      | `https://kedland.edu.gh`                                           |
| Vercel → web   | `NEXT_PUBLIC_DASHBOARD_URL` | `https://admin.kedland.edu.gh`                                     |
| Vercel → admin | `NEXT_PUBLIC_SITE_URL`      | `https://kedland.edu.gh`                                           |
| Render         | `DASHBOARD_URL`             | `https://admin.kedland.edu.gh`                                     |
| Render         | `REVALIDATE_WEBHOOK_URL`    | `https://kedland.edu.gh/api/revalidate`                            |
| Render         | `CORS_ORIGINS`              | include the three custom domains (and `.vercel.app` if still used) |

`NEXT_PUBLIC_*` values are baked in at build time — change them, then redeploy
web and admin. A mismatch on the two preview variables leaves the content
editor's live preview blank (CSP `frame-ancestors` / `frame-src`).

## The two-sided values

`REVALIDATE_SECRET` and `CORS_ORIGINS` exist in both Render and Vercel and must match. Changing
either is a two-sided deploy inside one window — update Render, update Vercel, then verify a publish
still refreshes the public site.

## Database

- **Backups:** Atlas continuous backup. **A restore is only real once it has been tested** — do that
  before launch and record the date here.
- **Restore:** _(to be written with the first tested restore)_

## Secrets

- Rotating `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` signs every staff member out. Acceptable —
  there are two or three of them. Do it immediately on any suspected leak.
- Rotating `REVALIDATE_SECRET` — see "the two-sided values" above.
- Nothing is ever committed. `.env.example` documents names only.

## Mail deliverability

Get these wrong and enquiry notifications land in spam:

- **SPF** — one TXT record combining Google Workspace _and_ Resend includes. Never two SPF records.
- **DKIM** — enabled separately for Workspace and for Resend.
- **DMARC** — a sensible policy record.

Verify after any DNS change.

## When something is down

| Down         | Effect                                                             | Do                                                                                                  |
| ------------ | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Render (API) | Public pages fine (static). Enquiry form and dashboard login fail. | Check Render status and the health endpoint; the form shows the school's phone numbers as fallback. |
| Atlas        | API readiness fails, dashboard unusable. Public pages fine.        | Check Atlas status; the API reports `checks.database: "down"` on `/api/v1/health/ready`.            |
| Resend       | Enquiries still persist — only delivery stops.                     | Work the inbox in the dashboard until service returns.                                              |
| Cloudinary   | Existing images cached; new uploads fail.                          | Retry later; nothing is lost.                                                                       |

## Staff accounts

- Locked out: _(to be written with the auth module)_
- Restoring a content revision: _(to be written with the revisions module)_

## Care plan

On-call contact and response times: _(to be agreed at handover)_
