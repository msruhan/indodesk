#!/usr/bin/env bash
# Restore PostgreSQL + uploads from R2 backup (SSH operator only).
# Usage: restore.sh --backup-id 2026-06-21T03-00-00Z [--dry-run] [--confirm]
set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/indoteknizi}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=lib/backup-common.sh
source "$SCRIPT_DIR/lib/backup-common.sh"

BACKUP_ID=""
DRY_RUN=0
CONFIRM=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backup-id) BACKUP_ID="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --confirm) CONFIRM=1; shift ;;
    -h|--help)
      echo "Usage: restore.sh --backup-id ID [--dry-run] [--confirm]"
      exit 0
      ;;
    *) echo "Unknown: $1"; exit 1 ;;
  esac
done

[[ -n "$BACKUP_ID" ]] || { echo "ERROR: --backup-id required"; exit 1; }

command -v aws >/dev/null 2>&1 || { echo "ERROR: aws CLI required"; exit 1; }

backup_load_env
COMPOSE=$(backup_compose_cmd)
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

backup_log "Resolve manifest for $BACKUP_ID ..."

# Find manifest — try daily then manual prefix from index or guess paths
MANIFEST_LOCAL="$WORK/manifest.json"
FOUND=0
for kind in daily manual; do
  KEY="backups/${kind}/${BACKUP_ID}/manifest.json"
  if backup_r2_download "$KEY" "$MANIFEST_LOCAL" 2>/dev/null; then
    FOUND=1
    break
  fi
done

if [[ "$FOUND" != "1" ]]; then
  echo "ERROR: manifest not found for backup id $BACKUP_ID"
  exit 1
fi

DB_KEY=$(python3 -c "import json; m=json.load(open('$MANIFEST_LOCAL')); print(m['database']['key'])")
UP_KEY=$(python3 -c "import json; m=json.load(open('$MANIFEST_LOCAL')); print(m['uploads']['key'])")

backup_log "Database object: $DB_KEY"
backup_log "Uploads object: $UP_KEY"

if [[ "$DRY_RUN" == "1" ]]; then
  backup_log "Dry-run OK — artifacts exist"
  exit 0
fi

if [[ "$CONFIRM" != "1" ]]; then
  echo ""
  echo "PERINGATAN: Restore akan menimpa database dan uploads production."
  echo "Backup ID: $BACKUP_ID"
  echo "Jalankan ulang dengan --confirm untuk melanjutkan."
  echo "Disarankan: bash deploy/backup.sh --type manual --tag pre-restore"
  exit 2
fi

backup_log "Pre-restore snapshot ..."
bash "$SCRIPT_DIR/backup.sh" --type manual --tag pre-restore

backup_log "Download artifacts ..."
backup_r2_download "$DB_KEY" "$WORK/database.dump.gz"
backup_r2_download "$UP_KEY" "$WORK/uploads.tar.gz"
gunzip -f "$WORK/database.dump.gz"

backup_log "Restore database ..."
$COMPOSE stop app
$COMPOSE exec -T postgres psql -U indoteknizi -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'indoteknizi' AND pid <> pg_backend_pid();" >/dev/null 2>&1 || true
$COMPOSE exec -T postgres dropdb -U indoteknizi --if-exists indoteknizi
$COMPOSE exec -T postgres createdb -U indoteknizi indoteknizi
POSTGRES_CID="$($COMPOSE ps -q postgres)"
docker cp "$WORK/database.dump" "${POSTGRES_CID}:/tmp/restore.dump"
$COMPOSE exec -T postgres pg_restore -U indoteknizi -d indoteknizi --clean --if-exists --no-owner /tmp/restore.dump
$COMPOSE exec -T postgres rm -f /tmp/restore.dump

backup_log "Restore uploads ..."
UPLOADS_VOL=$(backup_uploads_volume)
docker run --rm \
  -v "${UPLOADS_VOL}:/data" \
  -v "$WORK:/in" \
  alpine:3.20 \
  sh -c "rm -rf /data/* /data/.[!.]* 2>/dev/null; tar xzf /in/uploads.tar.gz -C /data"

backup_log "Start app ..."
$COMPOSE up -d app

HEALTH_URL="$(grep '^NEXT_PUBLIC_APP_URL=' "$ENV_FILE" | cut -d= -f2- | tr -d '"')/api/health"
backup_log "Health check $HEALTH_URL ..."
sleep 5
curl -fsS "$HEALTH_URL"
backup_log "Restore complete — $BACKUP_ID"
