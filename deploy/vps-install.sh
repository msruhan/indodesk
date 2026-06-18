#!/usr/bin/env bash
# Bootstrap IndoTeknizi di VPS co-host dengan Nexus.
# Jalankan di VPS: sudo bash deploy/vps-install.sh [opsi]
#
# Opsi:
#   --load-image FILE.tar   docker load image dari tar (dari ship-to-vps.sh)
#   --start                 up stack + migrate (butuh .env.production lengkap)
#   --domain FQDN           domain IndoTeknizi untuk merge Caddy (default: indoteknizi.com)
#   --nexus-dir PATH        default /opt/nexus-server
set -euo pipefail

INSTALL_DIR="/opt/indoteknizi"
NEXUS_DIR="/opt/nexus-server"
DOMAIN="indoteknizi.com"
LOAD_IMAGE=""
DO_START=0
IMAGE_NAME="indoteknizi:local"
PROXY_NETWORK="nexus-server_default"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --load-image) LOAD_IMAGE="$2"; shift 2 ;;
    --start) DO_START=1; shift ;;
    --domain) DOMAIN="$2"; shift 2 ;;
    --nexus-dir) NEXUS_DIR="$2"; shift 2 ;;
    --image) IMAGE_NAME="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,12p' "$0"
      exit 0
      ;;
    *) echo "Unknown: $1"; exit 1 ;;
  esac
done

log() { echo "[vps-install] $*"; }

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Jalankan dengan sudo"
  exit 1
fi

mkdir -p "$INSTALL_DIR/deploy"
cd "$INSTALL_DIR"

if [[ -n "$LOAD_IMAGE" ]]; then
  [[ -f "$LOAD_IMAGE" ]] || { echo "File tidak ada: $LOAD_IMAGE"; exit 1; }
  log "Loading Docker image from $LOAD_IMAGE ..."
  docker load -i "$LOAD_IMAGE"
fi

if ! docker image inspect "$IMAGE_NAME" >/dev/null 2>&1; then
  echo "ERROR: Image $IMAGE_NAME tidak ada. Build dulu atau --load-image."
  exit 1
fi

if ! docker network inspect "$PROXY_NETWORK" >/dev/null 2>&1; then
  log "WARN: network $PROXY_NETWORK tidak ada — buat manual atau deploy Nexus dulu"
  docker network create "$PROXY_NETWORK" || true
fi

if [[ ! -f .env.production ]]; then
  if [[ -f deploy/env.production.template ]]; then
    cp deploy/env.production.template .env.production
    log "Created .env.production dari template — EDIT dulu sebelum --start"
  else
    echo "ERROR: .env.production tidak ada"
    exit 1
  fi
fi

if ! grep -q '^POSTGRES_PASSWORD=' .env.production 2>/dev/null; then
  PG_PASS="$(openssl rand -hex 32)"
  echo "POSTGRES_PASSWORD=$PG_PASS" >> .env.production
  log "Generated POSTGRES_PASSWORD di .env.production"
fi

# Generate secrets placeholder jika masih CHANGE_ME
for key in AUTH_SECRET DATA_ENCRYPTION_KEY CRON_SECRET; do
  if grep -q "${key}=CHANGE_ME" .env.production 2>/dev/null; then
    val="$(openssl rand -base64 32)"
    sed -i "s|^${key}=.*|${key}=\"${val}\"|" .env.production
    log "Generated $key"
  fi
done

export POSTGRES_PASSWORD="$(grep '^POSTGRES_PASSWORD=' .env.production | cut -d= -f2- | tr -d '"')"
export BANTOO_IMAGE="$IMAGE_NAME"
export INDOTEKNIZI_IMAGE="$IMAGE_NAME"
export NEXUS_PROXY_NETWORK="$PROXY_NETWORK"

if [[ "$DO_START" -eq 0 ]]; then
  log "Preflight OK. Edit $INSTALL_DIR/.env.production lalu:"
  log "  cd $INSTALL_DIR && sudo -E bash deploy/vps-install.sh --start --domain $DOMAIN"
  exit 0
fi

# Validasi env wajib
for key in NEXT_PUBLIC_APP_URL AUTH_URL UPSTASH_REDIS_REST_URL UPSTASH_REDIS_REST_TOKEN; do
  if ! grep -q "^${key}=" .env.production || grep -q "^${key}=\"\"" .env.production; then
    echo "ERROR: isi $key di .env.production sebelum --start"
    exit 1
  fi
done

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
else
  COMPOSE=(docker-compose)
fi

log "Starting IndoTeknizi stack ..."
"${COMPOSE[@]}" -f docker-compose.production.yml --env-file .env.production up -d

log "Waiting for postgres ..."
for i in $(seq 1 30); do
  if "${COMPOSE[@]}" -f docker-compose.production.yml --env-file .env.production \
    exec -T postgres pg_isready -U indoteknizi >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

log "Running prisma migrate deploy ..."
PG_URL="postgresql://indoteknizi:${POSTGRES_PASSWORD}@postgres:5432/indoteknizi?schema=public"
MIGRATE_ARGS=(run --rm -e "DATABASE_URL=${PG_URL}" -e "DIRECT_URL=${PG_URL}")
if [[ -f "$INSTALL_DIR/prisma.config.ts" ]]; then
  MIGRATE_ARGS+=(-v "$INSTALL_DIR/prisma.config.ts:/app/prisma.config.ts:ro")
fi
"${COMPOSE[@]}" -f docker-compose.production.yml --env-file .env.production \
  "${MIGRATE_ARGS[@]}" app npm run db:setup:production

APP_CONTAINER="$(docker ps --format '{{.Names}}' | grep '^indoteknizi-app' | head -1)"
if [[ -z "$APP_CONTAINER" ]]; then
  echo "ERROR: container indoteknizi-app tidak ditemukan"
  docker ps
  exit 1
fi

log "App container: $APP_CONTAINER"

if [[ -f "$NEXUS_DIR/deploy/Caddyfile" ]]; then
  bash "$INSTALL_DIR/deploy/merge-caddy-indoteknizi.sh" \
    --nexus-dir "$NEXUS_DIR" \
    --domain "$DOMAIN" \
    --upstream "${APP_CONTAINER}:3000"
else
  log "WARN: Nexus Caddyfile tidak ada — routing HTTPS manual diperlukan"
fi

log "Smoke test internal ..."
docker run --rm --network "$PROXY_NETWORK" curlimages/curl:8.5.0 \
  -fsS "http://${APP_CONTAINER}:3000/api/health" || log "WARN: health check internal gagal"

log "Selesai. Tes dari luar:"
log "  curl -fsS https://${DOMAIN}/api/health"
