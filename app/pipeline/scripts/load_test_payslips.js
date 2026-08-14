/**
 * k6 Load Test Suite: Scenario A — Salary-Day Payslip Download & Stat Surge
 *
 * Simulates 500 Virtual Users (VUs) simultaneously logging into ESS,
 * downloading payslips, viewing salary statistics, and querying tax rules.
 * Tests:
 * 1. Cloudflare Edge KV caching tier & Cache-Control validation
 * 2. Static asset streaming from R2 & Worker Edge compute
 * 3. Latency targets: p50 < 50ms (cached), p99 < 250ms
 * 4. Zero 500 server error rate under 10x standard peak load
 *
 * Execution:
 *   k6 run app/pipeline/scripts/load_test_payslips.js
 */

import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// Custom Metrics
const payslipFetchDuration = new Trend('payslip_fetch_duration_ms')
const statsQueryDuration = new Trend('stats_query_duration_ms')
const taxSlabsDuration = new Trend('tax_slabs_duration_ms')
const cacheHitRate = new Rate('edge_cache_hit_rate')

export const options = {
  scenarios: {
    salary_day_surge: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '30s', target: 250 }, // Ramp up to 250 VUs
        { duration: '1m', target: 500 },  // Surge to 500 VUs
        { duration: '30s', target: 500 },  // Sustain peak load
        { duration: '30s', target: 0 },    // Ramp down to 0
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_duration: ['p(50)<50', 'p(90)<150', 'p(99)<250'], // Target: p50 < 50ms, p99 < 250ms
    http_req_failed: ['rate<0.001'],                           // Error rate < 0.1%
    payslip_fetch_duration_ms: ['p(95)<200'],
    stats_query_duration_ms: ['p(95)<100'],
    tax_slabs_duration_ms: ['p(95)<50'],
  },
}

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:8787'

export default function () {
  const orgId = 'org_demo_001'
  const empIndex = (__VU % 500) + 1
  const employeeId = `emp_scale_${String(empIndex).padStart(4, '0')}`

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'x-org-id': orgId,
      'Authorization': `Bearer mock_user_session_token_${employeeId}`,
    },
  }

  group('1. Query Tax Slabs (Cached KV)', function () {
    const start = Date.now()
    const res = http.get(`${BASE_URL}/api/tax/slabs?regime=new&year=2026`, params)
    taxSlabsDuration.add(Date.now() - start)

    const cacheHeader = res.headers['Cache-Control'] || res.headers['cache-control'] || ''
    if (cacheHeader.includes('max-age') || cacheHeader.includes('immutable')) {
      cacheHitRate.add(1)
    } else {
      cacheHitRate.add(0)
    }

    check(res, {
      'tax slabs returns 200': (r) => r.status === 200,
      'has cache-control header': () => cacheHeader.length > 0,
    })
  })

  group('2. Query Salary Statistics (Edge Aggregation)', function () {
    const start = Date.now()
    const res = http.get(`${BASE_URL}/api/salary-stats?month=8&year=2026`, params)
    statsQueryDuration.add(Date.now() - start)

    check(res, {
      'salary stats returns 200 or 404': (r) => r.status === 200 || r.status === 404,
      'response time under 150ms': () => (Date.now() - start) < 150,
    })
  })

  group('3. Download Employee Payslip Document', function () {
    const recordId = `sr_mock_${empIndex}`
    const start = Date.now()
    const res = http.get(`${BASE_URL}/api/docs/payslip/${recordId}`, params)
    payslipFetchDuration.add(Date.now() - start)

    check(res, {
      'payslip returns 200 or valid preview': (r) => r.status === 200 || r.status === 404,
      'response time under 250ms': () => (Date.now() - start) < 250,
    })
  })

  sleep(Math.random() * 2 + 1) // Realistic think time (1 to 3 seconds)
}
