#!/usr/bin/env bash
# Build image lokal, kirim ke VPS, load, dan jalankan vps-install.sh
# Usage (dari laptop):
#   bash deploy/ship-to-vps.sh root@13.140.135.88
set -euo pipefail

VPS_HOST="${1:-}"
IMAGE_TAG="${IMAGE_TAG:-local}"
INSTALL_DIR="/opt/indoteknizi"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -z "$VPS_HOST" ]]; then
  echo "Usage: $0 user@host"
  exit 1
fi

echo "==> Building indoteknizi:${IMAGE_TAG} ..."
docker build -t "indoteknizi:${IMAGE_TAG}" "$ROOT"

TAR="/tmp/indoteknizi-${IMAGE_TAG}.tar"
echo "==> Saving image to $TAR ..."
docker save "indoteknizi:${IMAGE_TAG}" -o "$TAR"

echo "==> Uploading deploy files + image to $VPS_HOST ..."
ssh "$VPS_HOST" "mkdir -p ${INSTALL_DIR}/deploy"
scp "$TAR" \
  "$ROOT/docker-compose.production.yml" \
  "$ROOT/deploy/vps-install.sh" \
  "$ROOT/deploy/merge-caddy-indoteknizi.sh" \
  "$ROOT/deploy/env.production.template" \
  "$VPS_HOST:${INSTALL_DIR}/"

ssh "$VPS_HOST" "mv ${INSTALL_DIR}/$(basename "$TAR") ${INSTALL_DIR}/image.tar && \
  mv ${INSTALL_DIR}/vps-install.sh ${INSTALL_DIR}/deploy/ && \
  mv ${INSTALL_DIR}/merge-caddy-indoteknizi.sh ${INSTALL_DIR}/deploy/ && \
  mv ${INSTALL_DIR}/env.production.template ${INSTALL_DIR}/deploy/ && \
  chmod +x ${INSTALL_DIR}/deploy/vps-install.sh ${INSTALL_DIR}/deploy/merge-caddy-indoteknizi.sh"

echo "==> Done. SSH ke VPS lalu:"
echo "   cd ${INSTALL_DIR}"
echo "   sudo bash deploy/vps-install.sh --load-image image.tar"
echo ""
echo "Atau jika .env.production sudah siap:"
echo "   sudo -E bash deploy/vps-install.sh --load-image image.tar --start"
