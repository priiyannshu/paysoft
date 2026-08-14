/**
 * k6 Load Test Suite: Scenario B — Multi-Tenant Concurrent Payroll Execution
 *
 * Simulates 20 distinct organizations running payroll simultaneously on salary day.
 * Tests:
 * 1. Cloudflare Workers isolate scaling
 * 2. Durable Objects single-threaded per-tenant month locking
 * 3. Statutory tax calculations and D1 database batch inserts
 * 4. Zero cross-tenant contention or unhandled 500 race conditions
 *
 * Execution:
 *   k6 run app/pipeline/scripts/load_test_payroll.js
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

// Custom Metrics
const errorRate = new Rate('payroll_error_rate')
const lockContentionRate = new Rate('payroll_lock_contention_rate')
const payrollRunDuration = new Trend('payroll_run_duration_ms')
const successfulRuns = new Counter('payroll_successful_runs')

export const options = {
  scenarios: {
    concurrent_payroll_runs: {
      executor: 'per-vu-iterations',
      vus: 20, // 20 concurrent organizations
      iterations: 5,
      maxDuration: '3m',
    },
  },
  thresholds: {
    payroll_error_rate: ['rate<0.01'], // < 1% error rate
    http_req_duration: ['p(90)<400', 'p(95)<600', 'p(99)<1200'], // 95% < 600ms
    http_req_failed: ['rate<0.01'],
  },
}

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:8787'

function generateEmployees(count, orgId) {
  const employees = []
  for (let i = 1; i <= count; i++) {
    const code = `EMP${String(i).padStart(3, '0')}`
    employees.push({
      employeeId: `${orgId}_${code}`,
      code: code,
      firstName: `User${i}`,
      lastName: `Org${orgId}`,
      basicPay: 40000 + (i % 10) * 5000,
      daPercent: 8,
      hraPercent: 40,
      workedDays: 30,
      totalMonthDays: 30,
      taxRegime: i % 2 === 0 ? 'new' : 'old',
    })
  }
  return employees
}

export default function () {
  const vuId = __VU // VU 1 to 20
  const orgId = `org_scale_${String(vuId).padStart(3, '0')}`
  const iteration = __ITER
  const month = (iteration % 12) + 1
  const year = 2026

  const employees = generateEmployees(25, orgId)

  const payload = JSON.stringify({
    orgId,
    month,
    year,
    employees,
  })

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'x-org-id': orgId,
      'Authorization': `Bearer mock_jwt_token_for_${orgId}`,
    },
    timeout: '30s',
  }

  const startTime = Date.now()
  const res = http.post(`${BASE_URL}/api/payroll/run`, payload, params)
  const duration = Date.now() - startTime
  payrollRunDuration.add(duration)

  if (res.status === 201) {
    successfulRuns.add(1)
    errorRate.add(0)
    lockContentionRate.add(0)

    const data = res.json()
    const runId = data.runId

    check(res, {
      'status is 201': (r) => r.status === 201,
      'has runId': () => !!runId,
      'calculated all 25 records': () => data.records && data.records.length === 25,
      'net pay is positive': () => data.records && data.records[0].netPay > 0,
    })

    // Poll live DO progress check
    if (runId) {
      const progressRes = http.get(`${BASE_URL}/api/payroll/run-progress/${runId}`, params)
      check(progressRes, {
        'progress endpoint reachable': (r) => r.status === 200,
      })
    }
  } else if (res.status === 409) {
    // 409 indicates DO lock correctly rejected concurrent overlap (intended DO protection)
    lockContentionRate.add(1)
    errorRate.add(0)
  } else {
    errorRate.add(1)
    check(res, {
      'unexpected failure': (r) => r.status === 201 || r.status === 409,
    })
  }

  sleep(1)
}
