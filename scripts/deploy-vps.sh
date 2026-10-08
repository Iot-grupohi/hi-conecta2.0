#!/usr/bin/env bash
# Deploy Hi-Conecta RH para VPS via rsync + docker compose.
#
# Uso:
#   export VPS_HOST=usuario@IP_OU_DOMINIO
#   export VPS_PATH=/opt/hi-conecta2.0
#   ./scripts/deploy-vps.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VPS_HOST="${VPS_HOST:-}"
VPS_PATH="${VPS_PATH:-/opt/hi-conecta2.0}"

if [[ -z "$VPS_HOST" ]]; then
  echo "Defina VPS_HOST, ex.: export VPS_HOST=root@192.168.0.10"
  exit 1
fi

echo "==> Sync para ${VPS_HOST}:${VPS_PATH}"
ssh "$VPS_HOST" "mkdir -p '$VPS_PATH'"
rsync -az --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude uploads \
  --exclude 'prisma/dev.db*' \
  --exclude .env \
  --exclude .env.production \
  --exclude 'Planilha de Vale Transporte 2026.xlsx' \
  "$ROOT/" "$VPS_HOST:$VPS_PATH/"

ssh "$VPS_HOST" bash -s <<EOF
set -euo pipefail
cd '$VPS_PATH'
if [[ ! -f .env.production ]]; then
  cp .env.production.example .env.production
  echo "Crie/edite .env.production com AUTH_SECRET e AUTH_URL antes do restart."
fi
docker compose build --pull
docker compose up -d
docker compose ps
EOF

echo "==> Deploy concluído em http://\${AUTH_URL:-$VPS_HOST:3000}"
