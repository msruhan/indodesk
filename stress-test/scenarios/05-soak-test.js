/**
 * S5 — Soak Test
 *
 * Constant 5 VU mixing semua flow selama 30 menit.
 * Tujuan: detect memory leak.
 * Spec §5.5.
 */

import http from 'k6/http'
import { sleep, group } from 'k6'
import { Trend } from 'k6/metrics'
import { BASE_URL, login, pickStressUser } from '../lib/auth.js'
import {
  randomSearchQuery,
  randomCategory,
  randomPage,
  thinkTimeNormal,
} from '../lib/data.js'

export const options = {
  vus: 5,
  duration: '30m',
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1500'],
  },
}

const memRss = new Trend('memory_rss_mb', false)

function snapshotMemory() {
  const res = http.get(`${BASE_URL}/api/stress-internal/memory`, {
    tags: { name: 'memory_snapshot' },
  })
  if (res.status === 200) {
    const body = res.json()
    if (body && typeof body.rssMB === 'number') {
      memRss.add(body.rssMB)
    }
  }
}

function browseFlow() {
  group('Browse', () => {
    http.get(`${BASE_URL}/`, { tags: { name: 'soak_landing' } })
    http.get(
      `${BASE_URL}/api/marketplace/products?category=${randomCategory()}&page=${randomPage()}`,
      { tags: { name: 'soak_marketplace' } },
    )
    http.get(`${BASE_URL}/api/search?q=${randomSearchQuery()}`, {
      tags: { name: 'soak_search' },
    })
  })
}

function pollFlow() {
  const user = pickStressUser(__VU)
  login(user.email, user.password)

  group('Poll', () => {
    http.get(`${BASE_URL}/api/notifications`, { tags: { name: 'soak_notif' } })
    http.get(`${BASE_URL}/api/chat/conversations`, { tags: { name: 'soak_chat' } })
  })
}

export default function () {
  // Distribusi: 60% browse, 30% poll, 10% memory snapshot
  const r = Math.random()
  if (r < 0.6) {
    browseFlow()
  } else if (r < 0.9) {
    pollFlow()
  } else {
    snapshotMemory()
  }
  sleep(thinkTimeNormal())
}

export function handleSummary(data) {
  const lines = []
  const memTrend = data.metrics.memory_rss_mb
  if (memTrend && memTrend.values) {
    lines.push('')
    lines.push('=== Memory RSS Summary ===')
    lines.push(`min: ${memTrend.values.min} MB`)
    lines.push(`max: ${memTrend.values.max} MB`)
    lines.push(`avg: ${memTrend.values.avg.toFixed(2)} MB`)
    const drift = memTrend.values.max - memTrend.values.min
    lines.push(`drift: ${drift.toFixed(2)} MB`)
    const verdict =
      drift < 10 ? '✅ PASS' : drift < 50 ? '⚠️  INVESTIGATE' : '❌ FAIL'
    lines.push(`verdict: ${verdict}`)
    lines.push('')
  }
  return {
    stdout: lines.join('\n') + '\n',
  }
}
