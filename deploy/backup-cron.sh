#!/usr/bin/env bash
# Cron wrapper: daily backup + poll manual queue.
# Usage: backup-cron.sh daily | poll-queue
set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/indoteknizi}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=lib/backup-common.sh
source "$SCRIPT_DIR/lib/backup-common.sh"

MODE="${1:-}"
[[ -n "$MODE" ]] || { echo "Usage: backup-cron.sh daily|poll-queue"; exit 1; }

cd "$INSTALL_DIR"

case "$MODE" in
  daily)
    bash "$SCRIPT_DIR/backup.sh" --type daily
    ;;
  poll-queue)
    QUEUE_DIR="$(backup_queue_dir)"
    PENDING="$QUEUE_DIR/.pending"
    if [[ ! -f "$PENDING" ]]; then
      exit 0
    fi
    backup_write_job_status running "Memulai backup manual..."
    rm -f "$PENDING"
    if bash "$SCRIPT_DIR/backup.sh" --type manual --tag admin-trigger; then
      backup_write_job_status success "Backup manual selesai"
    else
      backup_write_job_status failed "Backup manual gagal"
      exit 1
    fi
    ;;
  *)
    echo "Unknown mode: $MODE"
    exit 1
    ;;
esac
