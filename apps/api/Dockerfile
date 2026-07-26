# syntax=docker/dockerfile:1
#
# Kedland API — multi-stage build from the monorepo root.
#
# Build context is the repo root (see render.yaml `dockerContext: .`) because
# the API consumes @kedland/types as workspace source.

# ── Stage 1: dependencies ────────────────────────────────────────────────────
FROM node:26-alpine AS deps
WORKDIR /app

# pnpm is installed explicitly rather than through `corepack enable`.
#
# Corepack was unbundled from Node in v25, so it is simply not present in these
# images any more and the old line failed the build with "corepack: not found".
# The version is pinned to match the root package.json's `packageManager`, and
# `dockerfile.spec.ts` fails if the two ever drift — a mismatch here builds the
# API with a different resolver than every other environment uses.
ARG PNPM_VERSION=11.11.0
RUN npm install --global pnpm@${PNPM_VERSION}

# Only the manifests first, so a source change does not invalidate the
# dependency layer.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/

# The lockfile has already passed the supply-chain policy locally and in CI;
# re-verifying every entry here would just slow the image build down.
RUN pnpm install --frozen-lockfile --trust-lockfile

# ── Stage 2: build ───────────────────────────────────────────────────────────
FROM node:26-alpine AS build
WORKDIR /app

# Each stage is its own image and inherits nothing from the last; see above.
ARG PNPM_VERSION=11.11.0
RUN npm install --global pnpm@${PNPM_VERSION}

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/config ./packages/config
COPY packages/types ./packages/types
COPY apps/api ./apps/api

# `@kedland/types` ships TypeScript source and builds to `dist`; the API's
# tsconfig resolves it through that build output. Building the API alone leaves
# `packages/types/dist` absent, so `nest build` fails to resolve every
# `@kedland/types` import — which is a broken Render deploy, not a broken
# container. `...` builds the dependency graph, not just the one package.
RUN pnpm --filter @kedland/api... build

# Drop dev dependencies from the tree we are about to copy forward.
RUN pnpm --filter @kedland/api --prod deploy --legacy /app/pruned

# ── Stage 3: runtime ─────────────────────────────────────────────────────────
FROM node:26-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# dumb-init reaps zombies and forwards SIGTERM, so Render's shutdown signal
# actually reaches Nest's shutdown hooks instead of being swallowed by PID 1.
RUN apk add --no-cache dumb-init

# Never run as root.
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nestjs -G nodejs

COPY --from=build --chown=nestjs:nodejs /app/pruned/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/apps/api/package.json ./package.json

USER nestjs

# Render injects PORT; the env schema defaults it to 8080 for local runs.
EXPOSE 8080

# Render polls /api/v1/health separately — this is for `docker run` and compose.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
