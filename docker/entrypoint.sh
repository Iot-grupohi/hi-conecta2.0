#!/bin/sh
set -eu

mkdir -p /app/data /app/uploads

# Garante schema no SQLite persistente
if [ -n "${DATABASE_URL:-}" ]; then
  npx prisma db push --skip-generate
fi

# Seed opcional (apenas se SEED_ON_BOOT=true)
if [ "${SEED_ON_BOOT:-false}" = "true" ]; then
  npx tsx prisma/seed.ts || true
fi

exec "$@"
