# Deploy na VPS — Hi-Conecta RH

Stack: Docker Compose + Next.js + SQLite persistente (volume).

## Pré-requisitos na VPS

- Ubuntu 22.04+ (ou similar)
- Docker + Docker Compose plugin
- Porta `3000` liberada (ou 80/443 com Nginx)

```bash
# instalar Docker (Ubuntu)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

## 1. Subir o código

No seu PC (PowerShell / Git Bash):

```bash
git clone https://github.com/Iot-grupohi/hi-conecta2.0.git
cd hi-conecta2.0
```

Ou na VPS:

```bash
sudo mkdir -p /opt/hi-conecta2.0
sudo chown $USER:$USER /opt/hi-conecta2.0
cd /opt/hi-conecta2.0
git clone https://github.com/Iot-grupohi/hi-conecta2.0.git .
```

## 2. Configurar ambiente

```bash
cp .env.production.example .env.production
nano .env.production
```

Ajuste no mínimo:

- `AUTH_SECRET` — `openssl rand -base64 32`
- `AUTH_URL` — `http://SEU_IP:3000` ou `https://seu-dominio.com`
- `SEED_ON_BOOT=true` no primeiro boot (depois mude para `false`)

## 3. Subir

```bash
docker compose up -d --build
docker compose logs -f app
```

App em: `http://SEU_IP:3000`

Login demo (se seed ativo): `admin@hiconecta.local` / `admin123`

## 4. Atualizar depois

```bash
cd /opt/hi-conecta2.0
git pull
docker compose up -d --build
```

Ou do PC:

```bash
export VPS_HOST=root@SEU_IP
export VPS_PATH=/opt/hi-conecta2.0
bash scripts/deploy-vps.sh
```

## Firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 3000/tcp
# com domínio + nginx:
# sudo ufw allow 80/tcp
# sudo ufw allow 443/tcp
sudo ufw enable
```

## Dados persistentes

- Banco SQLite: volume Docker `hi_conecta_data`
- Uploads: volume `hi_conecta_uploads`

Backup rápido:

```bash
docker compose exec app cat /app/data/prod.db > backup-prod-$(date +%F).db
```
