#!/usr/bin/env bash
# Shared helpers for backup/restore scripts (sourced, not executed directly).
set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/indoteknizi}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"
BACKUP_ENV_FILE="${BACKUP_ENV_FILE:-.backup.env}"

backup_log() { echo "[backup] $*"; }

backup_load_env() {
  cd "$INSTALL_DIR"
  [[ -f "$ENV_FILE" ]] || { echo "ERROR: missing $INSTALL_DIR/$ENV_FILE"; exit 1; }
  [[ -f "$COMPOSE_FILE" ]] || { echo "ERROR: missing $INSTALL_DIR/$COMPOSE_FILE"; exit 1; }

  if [[ -f "$BACKUP_ENV_FILE" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$BACKUP_ENV_FILE"
    set +a
  fi

  export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-$(grep '^POSTGRES_PASSWORD=' "$ENV_FILE" | cut -d= -f2- | tr -d '"')}"

  : "${BACKUP_R2_BUCKET:?Set BACKUP_R2_BUCKET in .backup.env}"
  : "${BACKUP_R2_ACCESS_KEY_ID:?Set BACKUP_R2_ACCESS_KEY_ID in .backup.env}"
  : "${BACKUP_R2_SECRET_ACCESS_KEY:?Set BACKUP_R2_SECRET_ACCESS_KEY in .backup.env}"
  : "${BACKUP_R2_ENDPOINT:?Set BACKUP_R2_ENDPOINT in .backup.env}"

  BACKUP_RETENTION_DAILY_DAYS="${BACKUP_RETENTION_DAILY_DAYS:-14}"
  BACKUP_RETENTION_MANUAL_DAYS="${BACKUP_RETENTION_MANUAL_DAYS:-30}"
}

backup_compose() {
  if docker compose version >/dev/null 2>&1; then
    echo docker compose
  else
    echo docker-compose
  fi
}

backup_compose_cmd() {
  local compose
  compose=$(backup_compose)
  echo "$compose" -f "$COMPOSE_FILE" --env-file "$ENV_FILE"
}

backup_sha256() {
  local file="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$file" | awk '{print $1}'
  else
    shasum -a 256 "$file" | awk '{print $1}'
  fi
}

backup_aws() {
  AWS_ACCESS_KEY_ID="$BACKUP_R2_ACCESS_KEY_ID" \
  AWS_SECRET_ACCESS_KEY="$BACKUP_R2_SECRET_ACCESS_KEY" \
  AWS_DEFAULT_REGION="${BACKUP_R2_REGION:-auto}" \
  aws --endpoint-url "$BACKUP_R2_ENDPOINT" "$@"
}

backup_r2_upload() {
  local local_file="$1"
  local key="$2"
  backup_aws s3 cp "$local_file" "s3://${BACKUP_R2_BUCKET}/${key}" --only-show-errors
}

backup_r2_download() {
  local key="$1"
  local local_file="$2"
  backup_aws s3 cp "s3://${BACKUP_R2_BUCKET}/${key}" "$local_file" --only-show-errors
}

backup_project_name() {
  grep '^name:' "$COMPOSE_FILE" 2>/dev/null | awk '{print $2}' | tr -d '"' || echo indoteknizi
}

backup_uploads_volume() {
  echo "$(backup_project_name)_uploads"
}

backup_queue_dir() {
  echo "$INSTALL_DIR/backups-queue"
}

backup_write_job_status() {
  local status="$1"
  local message="${2:-}"
  local dir
  dir=$(backup_queue_dir)
  mkdir -p "$dir"
  cat >"$dir/.last-job.json" <<EOF
{"status":"${status}","message":"${message}","updatedAt":"$(date -u +%Y-%m-%dT%H:%M:%SZ)"}
EOF
}
