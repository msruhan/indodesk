#!/usr/bin/env bash
# Rolling deploy IndoTeknizi/Bantoo di VPS (dipanggil CI/CD atau manual).
# Usage:
#   BANTOO_IMAGE=ghcr.io/msruhan/bantoo:0.1.0 bash deploy/vps-deploy.sh
#   bash deploy/vps-deploy.sh --image ghcr.io/msruhan/bantoo:0.1.0
set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/indoteknizi}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"
HEALTH_URL="${HEALTH_URL:-}"
IMAGE="${BANTOO_IMAGE:-${INDOTEKNIZI_IMAGE:-}}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --image) IMAGE="$2"; shift 2 ;;
    --install-dir) INSTALL_DIR="$2"; shift 2 ;;
    --health-url) HEALTH_URL="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: BANTOO_IMAGE=ghcr.io/msruhan/bantoo:TAG $0"
      exit 0
      ;;
    *) echo "Unknown: $1"; exit 1 ;;
  esac
done

log() { echo "[vps-deploy] $*"; }

[[ -n "$IMAGE" ]] || { echo "ERROR: set BANTOO_IMAGE atau --image"; exit 1; }
[[ -f "$INSTALL_DIR/$ENV_FILE" ]] || { echo "ERROR: missing $INSTALL_DIR/$ENV_FILE"; exit 1; }
[[ -f "$INSTALL_DIR/$COMPOSE_FILE" ]] || { echo "ERROR: missing $INSTALL_DIR/$COMPOSE_FILE"; exit 1; }

cd "$INSTALL_DIR"

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
else
  COMPOSE=(docker-compose)
fi

export POSTGRES_PASSWORD="$(grep '^POSTGRES_PASSWORD=' "$ENV_FILE" | cut -d= -f2- | tr -d '"')"
export BANTOO_IMAGE="$IMAGE"
export INDOTEKNIZI_IMAGE="$IMAGE"

log "Pull $IMAGE ..."
"${COMPOSE[@]}" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull app

log "Recreate app container ..."
"${COMPOSE[@]}" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d app

log "Wait for postgres ..."
for i in $(seq 1 30); do
  if "${COMPOSE[@]}" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
    exec -T postgres pg_isready -U indoteknizi >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

log "prisma migrate deploy ..."
"${COMPOSE[@]}" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
  run --rm --no-deps app npm run db:setup:production

if [[ -z "$HEALTH_URL" ]]; then
  HEALTH_URL="$(grep '^NEXT_PUBLIC_APP_URL=' "$ENV_FILE" | cut -d= -f2- | tr -d '"')/api/health"
fi

log "Health check $HEALTH_URL ..."
curl -fsS "$HEALTH_URL"
log "Deploy OK — $IMAGE"
