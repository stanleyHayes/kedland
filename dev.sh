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
  # A TCP connect is the only check that works for both a container and a bare
  # mongod, and it is what the API is about to do anyway.
  nc -z localhost 27018 >/dev/null 2>&1
}

if mongo_up; then
  echo "  ✓ mongo already listening on :27018"
elif docker info >/dev/null 2>&1; then
  docker compose up -d mongo >/dev/null 2>&1 || true
  for _ in $(seq 1 40); do
    if mongo_up; then break; fi
    pause 1
  done
  echo "  ✓ mongo on :27018 (docker)"
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
  "$MONGOD" --dbpath "$DATA_DIR" --port 27018 --bind_ip 127.0.0.1 > "$LOG_DIR/mongo.log" 2>&1 &
  for _ in $(seq 1 40); do
    if mongo_up; then break; fi
    pause 1
  done
  if ! mongo_up; then
    echo "  ✗ mongod did not start — see $LOG_DIR/mongo.log" >&2
    exit 1
  fi
  echo "  ✓ mongo on :27018 (local mongod, no docker)"
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

MONGODB_URI=mongodb://localhost:27018
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

# ── 3. api ──────────────────────────────────────────────────────────────────

echo "Building the API…"
pnpm --filter @kedland/types build >"$LOG_DIR/build.log" 2>&1
pnpm --filter @kedland/api build >>"$LOG_DIR/build.log" 2>&1

echo "Starting the API…"
( cd apps/api && exec -a kedland-api-dev node dist/main.js ) > "$LOG_DIR/api.log" 2>&1 &
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

echo "Building the sites…"
pnpm --filter @kedland/web build >>"$LOG_DIR/build.log" 2>&1
pnpm --filter @kedland/admin build >>"$LOG_DIR/build.log" 2>&1

echo "Starting the sites…"
( cd apps/web && pnpm exec next start --port "$WEB_PORT" ) > "$LOG_DIR/web.log" 2>&1 &
( cd apps/admin && pnpm exec next start --port "$ADMIN_PORT" ) > "$LOG_DIR/admin.log" 2>&1 &

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
