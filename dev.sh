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
DATA_DIR=".dev-data/mongo"

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
  echo "  ✗ $name did not come up — see $LOG_DIR/" >&2
  return 1
}

stop_all() {
  echo "Stopping…"
  pkill -f "kedland-api-dev" 2>/dev/null || true
  pkill -f "mongod --dbpath .dev-data" 2>/dev/null || true
  pkill -f "next start --port" 2>/dev/null || true
  pkill -f "next dev --port" 2>/dev/null || true
  docker compose down >/dev/null 2>&1 || true
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

# Whether *our* mongod owns the port, rather than merely something being there.
mongo_is_ours() {
  pgrep -f "mongod --dbpath $DATA_DIR" >/dev/null 2>&1
}

if mongo_up && mongo_is_ours; then
  echo "  ✓ mongo already listening on :$MONGO_PORT"
elif mongo_up; then
  echo "  ✗ something else is already on :$MONGO_PORT." >&2
  echo "    Set MONGO_PORT in dev.sh to a free port and try again." >&2
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

API_INTERNAL_URL=http://localhost:${API_PORT}/api/v1
NEXT_PUBLIC_API_URL=http://localhost:${API_PORT}/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:${WEB_PORT}
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
fi

# ── 3. api ──────────────────────────────────────────────────────────────────

echo "Building the API…"
pnpm --filter @kedland/types build >"$LOG_DIR/build.log" 2>&1
pnpm --filter @kedland/api build >>"$LOG_DIR/build.log" 2>&1

echo "Starting the API…"
nohup bash -c 'cd apps/api && exec -a kedland-api-dev node dist/main.js' > "$LOG_DIR/api.log" 2>&1 &
disown
wait_for "http://localhost:${API_PORT}/api/v1/health" "api"
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
export API_INTERNAL_URL="http://localhost:${API_PORT}/api/v1"
export NEXT_PUBLIC_API_URL="http://localhost:${API_PORT}/api/v1"
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
  API           http://localhost:${API_PORT}/api/v1
  API docs      http://localhost:${API_PORT}/api/docs

  Sign in       admin@kedland.edu.gh / local-development-password

  Logs in ${LOG_DIR}/ · stop with ./dev.sh stop

DONE
