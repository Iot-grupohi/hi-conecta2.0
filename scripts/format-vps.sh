#!/usr/bin/env bash
# Formata / prepara uma VPS Ubuntu limpa para o Hi-Conecta RH.
# Rode NA VPS como root (ou com sudo):
#   curl -fsSL ... | bash
#   ou: bash scripts/format-vps.sh
#
# O que faz:
# - atualiza o sistema
# - cria usuário deploy (opcional)
# - instala Docker + Compose
# - configura firewall UFW (SSH + 80/443/3000)
# - clona o repositório em /opt/hi-conecta2.0
# - sobe o stack Docker
#
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/hi-conecta2.0}"
REPO_URL="${REPO_URL:-https://github.com/Iot-grupohi/hi-conecta2.0.git}"
APP_PORT="${APP_PORT:-3000}"
DEPLOY_USER="${DEPLOY_USER:-}"
PUBLIC_URL="${PUBLIC_URL:-}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Rode como root: sudo bash scripts/format-vps.sh"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "==> Atualizando sistema"
apt-get update -y
apt-get upgrade -y
apt-get install -y ca-certificates curl git ufw openssl

echo "==> Instalando Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

if [[ -n "$DEPLOY_USER" ]]; then
  if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
    echo "==> Criando usuário $DEPLOY_USER"
    adduser --disabled-password --gecos "" "$DEPLOY_USER"
  fi
  usermod -aG docker "$DEPLOY_USER"
  usermod -aG sudo "$DEPLOY_USER" || true
fi

echo "==> Firewall UFW"
ufw allow OpenSSH
ufw allow "${APP_PORT}/tcp"
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> Clonando / atualizando app em $APP_DIR"
mkdir -p "$APP_DIR"
if [[ -d "$APP_DIR/.git" ]]; then
  git -C "$APP_DIR" fetch --all
  git -C "$APP_DIR" reset --hard origin/main
  git -C "$APP_DIR" pull --ff-only origin main || true
else
  rm -rf "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

if [[ ! -f .env.production ]]; then
  cp .env.production.example .env.production
  SECRET="$(openssl rand -base64 32)"
  # sed portável
  sed -i "s|AUTH_SECRET=.*|AUTH_SECRET=\"$SECRET\"|" .env.production
  if [[ -n "$PUBLIC_URL" ]]; then
    sed -i "s|AUTH_URL=.*|AUTH_URL=\"$PUBLIC_URL\"|" .env.production
  else
    IP="$(curl -fsS ifconfig.me || hostname -I | awk '{print $1}')"
    sed -i "s|AUTH_URL=.*|AUTH_URL=\"http://$IP:$APP_PORT\"|" .env.production
  fi
  sed -i "s|SEED_ON_BOOT=.*|SEED_ON_BOOT=\"true\"|" .env.production
  sed -i "s|APP_PORT=.*|APP_PORT=$APP_PORT|" .env.production
  echo "==> .env.production gerado"
fi

echo "==> Subindo containers"
docker compose down --remove-orphans || true
docker compose up -d --build

echo
echo "============================================"
echo " VPS pronta · Hi-Conecta RH"
echo " Pasta: $APP_DIR"
echo " URL:   $(grep AUTH_URL .env.production | cut -d= -f2- | tr -d '\"')"
echo " Login: admin@hiconecta.local / admin123  (seed)"
echo " Depois do 1º acesso, sete SEED_ON_BOOT=false"
echo "============================================"
docker compose ps
