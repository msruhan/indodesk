#!/usr/bin/env bash
# Buat / perbarui admin production tanpa db:seed.
# Usage (di VPS):
#   cd /opt/indoteknizi
#   ADMIN_EMAIL=admin@bantoo.in bash deploy/bootstrap-admin.sh
set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/indoteknizi}"
ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"

cd "$INSTALL_DIR"
[[ -f "$ENV_FILE" ]] || { echo "Missing $ENV_FILE"; exit 1; }

export POSTGRES_PASSWORD="$(grep '^POSTGRES_PASSWORD=' "$ENV_FILE" | cut -d= -f2- | tr -d '"')"
export BANTOO_IMAGE="${BANTOO_IMAGE:-ghcr.io/msruhan/bantoo:0.1.1}"
PG_URL="postgresql://indoteknizi:${POSTGRES_PASSWORD}@postgres:5432/indoteknizi?schema=public"

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
else
  COMPOSE=(docker-compose)
fi

ARGS=(run --rm -e "DATABASE_URL=${PG_URL}" -e "DIRECT_URL=${PG_URL}")
[[ -n "${ADMIN_EMAIL:-}" ]] && ARGS+=(-e "ADMIN_EMAIL=${ADMIN_EMAIL}")
[[ -n "${ADMIN_NAME:-}" ]] && ARGS+=(-e "ADMIN_NAME=${ADMIN_NAME}")
[[ -n "${ADMIN_PASSWORD:-}" ]] && ARGS+=(-e "ADMIN_PASSWORD=${ADMIN_PASSWORD}")
[[ -f "$INSTALL_DIR/prisma.config.ts" ]] && ARGS+=(-v "$INSTALL_DIR/prisma.config.ts:/app/prisma.config.ts:ro")
[[ -f "$INSTALL_DIR/scripts/bootstrap-admin.ts" ]] && ARGS+=(-v "$INSTALL_DIR/scripts/bootstrap-admin.ts:/app/scripts/bootstrap-admin.ts:ro")

"${COMPOSE[@]}" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
  "${ARGS[@]}" app npx tsx scripts/bootstrap-admin.ts
