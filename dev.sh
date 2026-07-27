#!/usr/bin/env bash
#
# Brings the whole stack up locally: MongoDB, the API, the public site and the
# dashboard, with the school's copy seeded.
#
#   ./dev.sh          start everything
#   ./dev.sh stop     stop everything
#   ./dev.sh seed     re-seed the content only
#
# Ports are chosen at run time from the first free port in each range, because
# 3000/3001/8080 collide with Docker and other projects often enough that
# hardcoding them wastes more time than it saves. The chosen ports are written
# to .env and printed at the end.

set -euo pipefail
cd "$(dirname "$0")"

ENV_FILE=".env"
LOG_DIR=".dev-logs"
# The ports this run actually chose, so `stop` can be precise about what it kills.
PORTS_FILE=".dev-logs/ports"
# Absolute, because it doubles as the identity of *our* mongod below. A relative
# ".dev-data/mongo" would match any other project that happened to use the same
# layout, which is exactly the confusion this is here to prevent.
DATA_DIR="$PWD/.dev-data/mongo"

# Kedland's own database port. 27017 is a system-wide Mongo and 27018 is what
# every other local project reaches for first; a bare TCP probe on a shared
# port happily connects to someone else's data.
MONGO_PORT=27117

# ── helpers ─────────────────────────────────────────────────────────────────

# `sleep` is unavailable in some sandboxed shells; this waits the same way
# without depending on the binary.
pause() {
  perl -e 'select(undef, undef, undef, shift)' "$1" 2>/dev/null || :
}

free_port() {
  local port=$1
  while lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; do
    port=$((port + 1))
  done
  echo "$port"
}

wait_for() {
  local url=$1 name=$2 tries=${3:-60}
  for _ in $(seq 1 "$tries"); do
    if curl -fsS -o /dev/null "$url" 2>/dev/null; then
      return 0
    fi
    pause 1
  done
  # Say something useful. A service that hangs during boot writes nothing to its
  # own log, so "see .dev-logs/" points at an empty file — which is exactly what
  # happened when the API waited forever on a Mongo that had gone away.
  echo "  ✗ $name did not come up." >&2
  if ! nc -z localhost "$MONGO_PORT" >/dev/null 2>&1; then
    echo "    Nothing is listening on :$MONGO_PORT — the database is not up, which is" >&2
    echo "    the usual reason a service hangs before it logs anything." >&2
  elif [ -s "$LOG_DIR/$name.log" ]; then
    echo "    Last lines of $LOG_DIR/$name.log:" >&2
    tail -n 8 "$LOG_DIR/$name.log" | sed 's/^/      /' >&2
  else
    echo "    $LOG_DIR/$name.log is empty, so it never got as far as logging." >&2
  fi
  return 1
}

# Kills whatever is listening on one port, if anything is.
#
# By port rather than by process name, because Next renames itself: a process
# started as `next start --port 3100` is called `next-server` by the time it is
# serving, so `pkill -f "next start --port"` never reaches it. Two of those
# survived a stop, kept holding 3100 and 3101, and every later run drifted to the
# next free pair — which is why the printed URLs kept changing underneath us.
#
# Matching `next-server` by name would be the obvious fix and the wrong one: it
# would reach into any other project's dev server on this machine. The ports this
# script chose are recorded on start, so it can be exact instead.
kill_port() {
  local pids
  pids=$(lsof -nP -iTCP:"$1" -sTCP:LISTEN -t 2>/dev/null || true)
  if [ -n "$pids" ]; then
    # shellcheck disable=SC2086 — deliberately word-split; there may be several.
    kill $pids 2>/dev/null || true
  fi
}

stop_all() {
  echo "Stopping…"
  pkill -f "kedland-api-dev" 2>/dev/null || true
  # Same reasoning as `mongo_is_ours`: match the data directory, not a binary
  # name that carries its platform in it.
  pkill -f -- "--dbpath $DATA_DIR" 2>/dev/null || true

  # Whatever this project last bound, whatever it has since renamed itself to.
  if [ -f "$PORTS_FILE" ]; then
    while read -r port; do
      if [ -n "$port" ]; then kill_port "$port"; fi
    done < "$PORTS_FILE"
    rm -f "$PORTS_FILE"
  fi

  # Belt and braces for a stack started before the ports file existed.
  pkill -f "next start --port" 2>/dev/null || true
  pkill -f "next dev --port" 2>/dev/null || true
  docker compose down >/dev/null 2>&1 || true

  # Wait for Mongo's port to actually close.
  #
  # `docker compose down` returns while the container is still shutting down, so
  # a `stop` immediately followed by a `start` finds the port still accepting
  # connections. The start path then reports "mongo already listening", skips
  # starting one, and the API boots against a database that disappears from under
  # it — hanging before it ever logs a line, which surfaces only as the unhelpful
  # "api did not come up".
  for _ in $(seq 1 30); do
    if ! nc -z localhost "$MONGO_PORT" >/dev/null 2>&1; then break; fi
    pause 1
  done

  echo "  stopped"
}

case "${1:-start}" in
  stop) stop_all; exit 0 ;;
esac

# ── 1. database ─────────────────────────────────────────────────────────────

mkdir -p "$LOG_DIR" "$DATA_DIR"
echo "Starting MongoDB…"

mongo_up() {
  nc -z localhost "$MONGO_PORT" >/dev/null 2>&1
}

# Whether *our* mongo owns the port, rather than merely something being there.
#
# This script starts Mongo two ways — a compose container, or the cached mongod
# from mongodb-memory-server when Docker is not running — so there are two things
# to recognise. Knowing only one of them is a refusal to start: a run that
# followed a Docker start reported "something else is already on :27117" about
# its own database.
#
# The local case is matched on the data directory alone, never on "mongod
# --dbpath". The cached binary carries its platform in its name
# (`mongod-arm64-8.0.4`), so that pattern never matches.
#
# The container case goes through `docker compose ps`, which scopes the answer to
# this project's `mongo` service — rather than any container on the machine that
# happens to be called mongo, which would defeat the point of the check.
mongo_is_ours() {
  pgrep -f -- "--dbpath $DATA_DIR" >/dev/null 2>&1 && return 0

  docker compose ps --services --status running 2>/dev/null | grep -qx mongo
}

if mongo_up && mongo_is_ours; then
  echo "  ✓ mongo already listening on :$MONGO_PORT"
elif mongo_up; then
  echo "  ✗ something else is already on :$MONGO_PORT." >&2
  echo "    If it is a leftover from this project, ./dev.sh stop clears it." >&2
  echo "    Otherwise set MONGO_PORT in dev.sh to a free port and try again." >&2
  exit 1
elif docker info >/dev/null 2>&1; then
  docker compose up -d mongo >/dev/null 2>&1 || true
  for _ in $(seq 1 40); do
    if mongo_up; then break; fi
    pause 1
  done
  echo "  ✓ mongo on :$MONGO_PORT (docker)"
else
  # No Docker daemon. `mongodb-memory-server` — already a dev dependency for
  # the integration suite — caches a real mongod, so the stack does not need
  # Docker running just to have a database.
  MONGOD=$(ls -1 "$HOME"/.cache/mongodb-binaries/mongod-* 2>/dev/null | sort -V | tail -1 || true)
  if [ -z "$MONGOD" ]; then
    echo "  ✗ Docker is not running and no cached mongod was found." >&2
    echo "    Start Docker Desktop, or run the API test suite once to fetch a mongod." >&2
    exit 1
  fi
  nohup "$MONGOD" --dbpath "$DATA_DIR" --port "$MONGO_PORT" --bind_ip 127.0.0.1 \
    > "$LOG_DIR/mongo.log" 2>&1 &
  disown
  for _ in $(seq 1 40); do
    if mongo_up; then break; fi
    pause 1
  done
  if ! mongo_up; then
    echo "  ✗ mongod did not start — see $LOG_DIR/mongo.log" >&2
    exit 1
  fi
  echo "  ✓ mongo on :$MONGO_PORT (local mongod, no docker)"
fi

# ── 2. environment ──────────────────────────────────────────────────────────

API_PORT=$(free_port 8100)
WEB_PORT=$(free_port 3100)
ADMIN_PORT=$(free_port "$((WEB_PORT + 1))")

# Recorded so `./dev.sh stop` can kill exactly these, and nothing else.
printf '%s\n' "$API_PORT" "$WEB_PORT" "$ADMIN_PORT" > "$PORTS_FILE"

# Shared by the API (which calls the webhook) and the site (which authenticates
# it). Both sides must carry the same value or every publish silently fails to
# refresh the site, so it is generated once here rather than typed twice.
REVALIDATE_SECRET="local-development-revalidate-secret-not-a-real-one"

# Development-only secrets. Real values live in Render and Vercel; this file is
# gitignored and regenerated on every run.
cat > "$ENV_FILE" <<ENV
NODE_ENV=development
PORT=${API_PORT}

MONGODB_URI=mongodb://localhost:${MONGO_PORT}
MONGODB_DB=kedland

CORS_ORIGINS=http://localhost:${WEB_PORT},http://localhost:${ADMIN_PORT}

JWT_ACCESS_SECRET=local-development-access-secret-not-a-real-one
JWT_REFRESH_SECRET=local-development-refresh-secret-not-a-real-one
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

SEED_ADMIN_EMAIL=admin@kedland.edu.gh
SEED_ADMIN_PASSWORD=local-development-password

REVALIDATE_WEBHOOK_URL=http://localhost:${WEB_PORT}/api/revalidate
REVALIDATE_SECRET=${REVALIDATE_SECRET}

# Where the dashboard is, for the link in a staff invitation. Without it the API
# refuses to invite anybody, which is correct but confusing locally.
DASHBOARD_URL=http://localhost:${ADMIN_PORT}

API_INTERNAL_URL=http://127.0.0.1:${API_PORT}/api/v1
NEXT_PUBLIC_API_URL=http://127.0.0.1:${API_PORT}/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:${WEB_PORT}

# The only origin allowed to frame /preview, for the dashboard's live editor.
NEXT_PUBLIC_DASHBOARD_URL=http://localhost:${ADMIN_PORT}
SESSION_SECRET=local-development-session-secret-not-a-real-one
ENV

# Real credentials — Cloudinary, Resend, Turnstile — live in `.env.secrets`,
# which this script never rewrites. Appending them after the generated block
# means a duplicated key resolves to the pasted value, so anything set there
# overrides the development default above.
if [ -f ".env.secrets" ]; then
  printf '\n# ── appended from .env.secrets ──\n' >> "$ENV_FILE"
  grep -Ev '^\s*(#|$)' .env.secrets >> "$ENV_FILE" || true

  # A blank assignment is worse than an absent key: it satisfies a
  # "is it set?" check while being unusable. Drop them.
  grep -Ev '^[A-Z_]+=$' "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"

  if grep -q '^CLOUDINARY_API_SECRET=.' "$ENV_FILE"; then
    echo "  ✓ Cloudinary credentials picked up from .env.secrets"
  fi

  # The school's real Turnstile secret pairs with a site key that will not run
  # on localhost, so swap in Cloudflare's always-pass test secret to match the
  # test site key the web app is given below.
  if grep -q '^TURNSTILE_SECRET_KEY=.' "$ENV_FILE"; then
    grep -v '^TURNSTILE_SECRET_KEY=' "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
    echo "TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA" >> "$ENV_FILE"
    echo "  ✓ Turnstile using Cloudflare's localhost test keys (real keys are for deploys)"
  fi
fi

# Next reads `.env` from the app's own directory, never from the repository
# root, so each app gets its own — written here rather than maintained by hand
# because the ports above are chosen at run time and a hand-written file would
# be stale the first time 3100 was already taken.
#
# `.env.production` in those directories is left alone: it belongs to local
# production builds, and this is not one.
# Cloudflare's own always-pass test keys, published for exactly this purpose.
#
# A real Turnstile key is registered against a hostname, so the school's
# production key refuses to start on localhost — and when it refuses,
# Cloudflare renders its own unstyled error UI ("Troubleshoot") into the middle
# of the contact form. Worse, the API now has a real secret, so it would reject
# the tokenless submit that follows and the form would be unusable locally.
#
# These two are documented by Cloudflare as the always-pass pair. Development
# gets a working widget and a working form; the school's real keys stay for
# Vercel and Render, where the hostname actually matches.
TURNSTILE_SITE_KEY="1x00000000000000000000AA"
# The site builds Cloudinary delivery URLs itself — a post's cover image is
# stored as a public id, not a URL — so it needs the cloud name too. Read from
# the same place the API gets it, so the two can never disagree.
CLOUD_NAME=$(grep -E '^CLOUDINARY_CLOUD_NAME=.' .env.secrets 2>/dev/null | cut -d= -f2- || true)

cat > apps/web/.env <<ENV
# Written by ./dev.sh — edit .env.secrets at the repository root instead.
NEXT_PUBLIC_SITE_URL=http://localhost:${WEB_PORT}
NEXT_PUBLIC_API_URL=http://127.0.0.1:${API_PORT}/api/v1
API_INTERNAL_URL=http://127.0.0.1:${API_PORT}/api/v1
# The only origin allowed to frame /preview — without it the production build
# answers `frame-ancestors 'none'` and the dashboard's live preview stays dead.
NEXT_PUBLIC_DASHBOARD_URL=http://localhost:${ADMIN_PORT}
NEXT_PUBLIC_TURNSTILE_SITE_KEY=${TURNSTILE_SITE_KEY:-}
CLOUDINARY_CLOUD_NAME=${CLOUD_NAME:-}
REVALIDATE_SECRET=${REVALIDATE_SECRET}
ENV

cat > apps/admin/.env <<ENV
# Written by ./dev.sh — edit .env.secrets at the repository root instead.
NEXT_PUBLIC_API_URL=http://127.0.0.1:${API_PORT}/api/v1
API_INTERNAL_URL=http://127.0.0.1:${API_PORT}/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:${WEB_PORT}
SESSION_SECRET=local-development-session-secret-not-a-real-one
ENV

# ── 3. api ──────────────────────────────────────────────────────────────────

echo "Building the API…"
pnpm --filter @kedland/types build >"$LOG_DIR/build.log" 2>&1
pnpm --filter @kedland/api build >>"$LOG_DIR/build.log" 2>&1

echo "Starting the API…"
nohup bash -c 'cd apps/api && exec -a kedland-api-dev node dist/main.js' > "$LOG_DIR/api.log" 2>&1 &
disown
wait_for "http://127.0.0.1:${API_PORT}/api/v1/health" "api"
echo "  ✓ api on :${API_PORT}"

# ── 4. seed ─────────────────────────────────────────────────────────────────

echo "Seeding…"
( cd apps/api && node -e "
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { SeedService } = require('./dist/database/seeds/seed.service');
NestFactory.createApplicationContext(AppModule, { logger: ['error'] })
  .then(async (app) => {
    const summary = await app.get(SeedService).run({ force: ${SEED_FORCE:-false} });
    for (const [k, v] of Object.entries(summary)) console.log('  ' + k + ': ' + v);
    await app.close();
    process.exit(0);
  })
  .catch((e) => { console.error('  seed failed:', e.message); process.exit(1); });
" ) 2>&1 | grep -E "^  " || true

if [ "${1:-start}" = "seed" ]; then exit 0; fi

# ── 5. web and admin ────────────────────────────────────────────────────────

# Next reads `.env` from the app directory, not the repository root, so the
# builds would otherwise see no API URL and prerender every page as the
# "could not load" notice.
#
# Only the variables Next needs are exported. Sourcing the whole file would
# also export NODE_ENV=development, and a "development" build produces a React
# that fails to prerender at all — a confusing way to break a production build.
export API_INTERNAL_URL="http://127.0.0.1:${API_PORT}/api/v1"
export NEXT_PUBLIC_API_URL="http://127.0.0.1:${API_PORT}/api/v1"
export NEXT_PUBLIC_SITE_URL="http://localhost:${WEB_PORT}"

# NEXT_PUBLIC_* values are inlined at build time, not read at runtime, so the
# Turnstile site key has to be present now or the widget renders unconfigured.
if [ -f ".env.secrets" ]; then
  TURNSTILE_SITE_KEY=$(grep -E '^NEXT_PUBLIC_TURNSTILE_SITE_KEY=.' .env.secrets | cut -d= -f2- || true)
  [ -n "${TURNSTILE_SITE_KEY:-}" ] && export NEXT_PUBLIC_TURNSTILE_SITE_KEY="$TURNSTILE_SITE_KEY"
fi

echo "Building the sites…"
pnpm --filter @kedland/web build >>"$LOG_DIR/build.log" 2>&1
pnpm --filter @kedland/admin build >>"$LOG_DIR/build.log" 2>&1

echo "Starting the sites…"
nohup bash -c "cd apps/web && exec pnpm exec next start --port $WEB_PORT" > "$LOG_DIR/web.log" 2>&1 &
disown
nohup bash -c "cd apps/admin && exec pnpm exec next start --port $ADMIN_PORT" > "$LOG_DIR/admin.log" 2>&1 &
disown

wait_for "http://localhost:${WEB_PORT}/" "web"
wait_for "http://localhost:${ADMIN_PORT}/" "admin"

cat <<DONE

  Public site   http://localhost:${WEB_PORT}
  Dashboard     http://localhost:${ADMIN_PORT}
  API           http://127.0.0.1:${API_PORT}/api/v1
  API docs      http://127.0.0.1:${API_PORT}/api/docs

  Sign in       admin@kedland.edu.gh / local-development-password

  Logs in ${LOG_DIR}/ · stop with ./dev.sh stop

DONE
