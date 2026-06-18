#!/usr/bin/env bash
# Merge block IndoTeknizi ke Caddyfile Nexus setelah Hermes reinstall.
# Usage:
#   sudo bash deploy/merge-caddy-indoteknizi.sh \
#     --nexus-dir /opt/nexus-server \
#     --domain indoteknizi.com \
#     --upstream indoteknizi-app-1:3000
set -euo pipefail

NEXUS_DIR="/opt/nexus-server"
DOMAIN=""
UPSTREAM="indoteknizi-app-1:3000"
DRY_RUN=0

usage() {
  echo "Usage: $0 --domain <fqdn> [--nexus-dir /opt/nexus-server] [--upstream host:port] [--dry-run]"
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --nexus-dir) NEXUS_DIR="$2"; shift 2 ;;
    --domain) DOMAIN="$2"; shift 2 ;;
    --upstream) UPSTREAM="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage ;;
    *) echo "Unknown arg: $1"; usage ;;
  esac
done

[[ -n "$DOMAIN" ]] || usage
CADDYFILE="$NEXUS_DIR/deploy/Caddyfile"
MARKER="# indoteknizi-block-managed"

if [[ ! -f "$CADDYFILE" ]]; then
  echo "ERROR: Caddyfile not found: $CADDYFILE"
  exit 1
fi

BLOCK=$(cat <<EOF

$MARKER
$DOMAIN {
	reverse_proxy $UPSTREAM
}
EOF
)

if grep -q "$MARKER" "$CADDYFILE"; then
  echo "Block IndoTeknizi sudah ada di $CADDYFILE — lewati."
  exit 0
fi

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "Would append to $CADDYFILE:"
  echo "$BLOCK"
  exit 0
fi

cp "$CADDYFILE" "${CADDYFILE}.bak.$(date +%Y%m%d%H%M%S)"
printf '%s\n' "$BLOCK" >>"$CADDYFILE"
echo "Appended IndoTeknizi block to $CADDYFILE"

cd "$NEXUS_DIR"
if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
else
  COMPOSE=(docker-compose)
fi

"${COMPOSE[@]}" -f docker-compose.stack.yml -f docker-compose.caddy.yml restart caddy
echo "Caddy restarted. Test: curl -I https://$DOMAIN/api/health"
