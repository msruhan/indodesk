#!/bin/bash
#
# Stress Test Monitor
# Loop tiap 5 detik tampilkan: connection count, memory RSS, top active queries.
#
# Usage: bash stress-test/monitor.sh
#
# Env override:
#   DB_USER (default: indoteknizi)
#   DB_NAME (default: indoteknizi)
#   DB_CONTAINER (default: indoteknizi-postgres)
#   APP_URL (default: http://localhost:3000)
#   INTERVAL (default: 5)

set -e

DB_USER="${DB_USER:-indoteknizi}"
DB_NAME="${DB_NAME:-indoteknizi}"
DB_CONTAINER="${DB_CONTAINER:-indoteknizi-postgres}"
APP_URL="${APP_URL:-http://localhost:3000}"
INTERVAL="${INTERVAL:-5}"

echo "🔍 Monitoring PostgreSQL & Memory"
echo "   Interval: ${INTERVAL}s"
echo "   DB Container: ${DB_CONTAINER}"
echo "   App URL: ${APP_URL}"
echo "   Press Ctrl+C to stop"
echo ""

while true; do
  clear
  echo "=== $(date '+%H:%M:%S') ==="

  echo ""
  echo "📊 PostgreSQL Connections:"
  docker exec "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -c \
    "SELECT state, count(*) FROM pg_stat_activity WHERE datname = current_database() GROUP BY state ORDER BY count DESC;" \
    2>/dev/null || echo "   (DB unavailable)"

  echo ""
  echo "🧠 Node.js Memory (RSS):"
  curl -s "${APP_URL}/api/_internal/memory" 2>/dev/null \
    | python3 -c "import sys, json; d=json.load(sys.stdin); print(f'   RSS={d[\"rssMB\"]}MB  heap={d[\"heapUsedMB\"]}/{d[\"heapTotalMB\"]}MB  uptime={d[\"uptime\"]}s')" \
    2>/dev/null || echo "   (memory endpoint unavailable — STRESS_TEST_MODE off?)"

  echo ""
  echo "🔥 Active Queries (>1s):"
  docker exec "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -c \
    "SELECT pid, now() - query_start AS duration, left(query, 80) AS query FROM pg_stat_activity WHERE state = 'active' AND query_start IS NOT NULL AND now() - query_start > interval '1 second' ORDER BY duration DESC LIMIT 5;" \
    2>/dev/null || echo "   (none)"

  sleep "${INTERVAL}"
done
