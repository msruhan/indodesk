#!/usr/bin/env bash
# Backup PostgreSQL + uploads volume to R2.
# Usage: backup.sh --type daily|manual [--tag pre-deploy|pre-migration|admin-trigger|pre-restore]
set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/indoteknizi}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=lib/backup-common.sh
source "$SCRIPT_DIR/lib/backup-common.sh"

BACKUP_TYPE="manual"
BACKUP_TAG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --type) BACKUP_TYPE="$2"; shift 2 ;;
    --tag) BACKUP_TAG="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: backup.sh --type daily|manual [--tag NAME]"
      exit 0
      ;;
    *) echo "Unknown: $1"; exit 1 ;;
  esac
done

[[ "$BACKUP_TYPE" == "daily" || "$BACKUP_TYPE" == "manual" ]] || {
  echo "ERROR: --type must be daily or manual"
  exit 1
}

command -v aws >/dev/null 2>&1 || {
  echo "ERROR: aws CLI required (apt install awscli)"
  exit 1
}

command -v python3 >/dev/null 2>&1 || {
  echo "ERROR: python3 required"
  exit 1
}

backup_load_env
COMPOSE=$(backup_compose_cmd)
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

BACKUP_ID="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
PREFIX="backups/${BACKUP_TYPE}/${BACKUP_ID}"

backup_log "Start $BACKUP_TYPE backup $BACKUP_ID tag=${BACKUP_TAG:-none}"

backup_log "Dump database ..."
$COMPOSE exec -T postgres pg_dump -U indoteknizi -Fc indoteknizi >"$WORK/database.dump"
gzip -9 "$WORK/database.dump"
DB_FILE="$WORK/database.dump.gz"
DB_SHA=$(backup_sha256 "$DB_FILE")
DB_SIZE=$(stat -c%s "$DB_FILE" 2>/dev/null || stat -f%z "$DB_FILE")

backup_log "Archive uploads volume ..."
UPLOADS_VOL=$(backup_uploads_volume)
UP_FILE="$WORK/uploads.tar.gz"
if docker volume inspect "$UPLOADS_VOL" >/dev/null 2>&1; then
  docker run --rm \
    -v "${UPLOADS_VOL}:/data:ro" \
    -v "$WORK:/out" \
    alpine:3.20 \
    tar czf "/out/uploads.tar.gz" -C /data .
else
  backup_log "WARN: uploads volume missing — empty archive"
  tar czf "$UP_FILE" --files-from /dev/null
fi
UP_SHA=$(backup_sha256 "$UP_FILE")
UP_SIZE=$(stat -c%s "$UP_FILE" 2>/dev/null || stat -f%z "$UP_FILE")

backup_log "Upload to R2 ..."
backup_r2_upload "$DB_FILE" "${PREFIX}/database.dump.gz"
backup_r2_upload "$UP_FILE" "${PREFIX}/uploads.tar.gz"

CREATED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
MANIFEST="$WORK/manifest.json"
TAG_JSON="null"
if [[ -n "$BACKUP_TAG" ]]; then
  TAG_JSON="\"${BACKUP_TAG}\""
fi
cat >"$MANIFEST" <<EOF
{
  "id": "${BACKUP_ID}",
  "type": "${BACKUP_TYPE}",
  "tag": ${TAG_JSON},
  "createdAt": "${CREATED_AT}",
  "status": "success",
  "host": "production",
  "database": {
    "key": "${PREFIX}/database.dump.gz",
    "sizeBytes": ${DB_SIZE},
    "sha256": "${DB_SHA}"
  },
  "uploads": {
    "key": "${PREFIX}/uploads.tar.gz",
    "sizeBytes": ${UP_SIZE},
    "sha256": "${UP_SHA}"
  }
}
EOF

backup_r2_upload "$MANIFEST" "${PREFIX}/manifest.json"
python3 "$SCRIPT_DIR/backup-update-index.py" "$MANIFEST"

backup_write_job_status success "Backup ${BACKUP_ID} selesai"
backup_log "Done — ${BACKUP_ID}"
