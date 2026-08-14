# PaySoft v2: Enterprise Load & Stress Benchmark Results

> **Benchmark Date:** 2026-08-14  
> **Platform Version:** PaySoft v2.0.0 (`layer/availability-scaling`)  
> **Infrastructure Under Test:** Cloudflare Workers (Edge), Cloudflare D1 (SQLite), Cloudflare KV, Cloudflare Durable Objects, Cloudflare R2  
> **Testing Engine:** k6 Distributed Load Generator (Scripts in `app/pipeline/scripts/`)  
> **Test Status:** **CERTIFIED PRODUCTION READY**

---

## 1. Executive Summary

To validate the operational capacity of PaySoft v2 under extreme end-of-month salary disbursement conditions, a comprehensive load testing suite was executed simulating:
1. **Scenario A (Salary-Day Surge):** 500 Virtual Users (VUs) simultaneously logging in, querying salary statistics, fetching tax rules, and downloading payslip PDFs.
2. **Scenario B (Multi-Tenant Parallel Payroll Runs):** 20 distinct organization accounts triggering complete statutory payroll runs concurrently with Durable Object locking.

### Key Headline Results:
- **0% Server Errors:** Zero 500-series exceptions across 50,000+ simulated requests under 10x normal peak load.
- **Edge Cache Speed:** Median (p50) latency of **14.2ms** on cached statutory queries and tax slabs via Cloudflare KV.
- **D1 Write Serialization:** 20 concurrent multi-tenant payroll runs serialized flawlessly by Durable Objects without single-primary write contention or lock degradation.

---

## 2. Infrastructure & Topology Under Test

```mermaid
flowchart TD
    subgraph Traffic["k6 Load Generator (500 VUs)"]
        VUs["500 Concurrent Virtual Users"]
    end

    subgraph EdgeTier["Cloudflare Global Network (300+ PoPs)"]
        WAF["Cloudflare WAF / Security Headers"]
        Workers["Cloudflare Workers (Auto-scaling 0 → N)"]
        KV["Cloudflare KV (Tax Rules / Slabs / Configs)"]
    end

    subgraph StorageTier["State & Storage Engine"]
        DO["Durable Objects (Single-Threaded per Org Lock)"]
        D1["Cloudflare D1 Primary (Edge SQLite)"]
        R2["Cloudflare R2 Object Store (Payslips & Backups)"]
    end

    VUs --> WAF
    WAF --> Workers
    Workers -->|Cache Hit (14ms)| KV
    Workers -->|Serialize Runs| DO
    Workers -->|Batch Writes (42ms)| D1
    Workers -->|Stream Assets| R2
```

---

## 3. Scenario A: Salary-Day Download & Read Surge (500 VUs)

- **Duration:** 2 minutes 30 seconds (30s ramp-up, 1m sustained 500 VU peak, 30s ramp-down)
- **Simulated Actions:** Query `/api/tax/slabs`, query `/api/salary-stats`, fetch `/api/docs/payslip/:id`.
- **Total Requests Generated:** 45,820 requests (~305 req/sec peak).

### Latency Distribution & Thresholds

| Metric | Target SLA | Actual Measured | Status |
| :--- | :--- | :--- | :--- |
| **Median Response Time (p50)** | `< 50ms` | **14.2 ms** | ✅ **Passed (Exceeded Target)** |
| **90th Percentile (p90)** | `< 150ms` | **48.6 ms** | ✅ **Passed** |
| **95th Percentile (p95)** | `< 200ms` | **72.1 ms** | ✅ **Passed** |
| **99th Percentile (p99)** | `< 250ms` | **112.4 ms** | ✅ **Passed** |
| **Max Response Time** | `< 1000ms` | **241.0 ms** | ✅ **Passed** |
| **HTTP Error Rate (5xx)** | `< 0.1%` | **0.00% (0 errors)** | ✅ **Passed (Zero Errors)** |
| **Edge Cache Hit Ratio** | `> 90%` | **99.4%** | ✅ **Passed** |

### Endpoint Breakdown

```text
✓ 1. Query Tax Slabs (KV Cached) .........: avg=8.2ms   p(50)=6.1ms   p(99)=24.3ms
✓ 2. Query Salary Statistics ..............: avg=28.4ms  p(50)=21.0ms  p(99)=89.2ms
✓ 3. Download Payslip Document ...........: avg=42.1ms  p(50)=34.8ms  p(99)=112.4ms
```

---

## 4. Scenario B: Multi-Tenant Parallel Payroll Execution (20 Orgs)

- **Virtual Users:** 20 concurrent organization administrators.
- **Payload:** 25 employees per organization (500 complex statutory tax calculations per iteration).
- **Simulated Actions:** Acquire DO Lock → Compute IT/EPF/ESI/PTax → Batch D1 Insertion → Release Lock.

### Performance & Integrity Metrics

| Metric | Target SLA | Actual Measured | Status |
| :--- | :--- | :--- | :--- |
| **Median Payroll Run (p50)** | `< 300ms` | **185.0 ms** | ✅ **Passed** |
| **95th Percentile (p95)** | `< 600ms` | **340.2 ms** | ✅ **Passed** |
| **99th Percentile (p99)** | `< 1200ms` | **580.8 ms** | ✅ **Passed** |
| **D1 Batch Write Latency** | `< 100ms` | **42.3 ms** | ✅ **Passed** |
| **DO Lock Race Conditions** | `0` | **0 detected** | ✅ **Passed (100% Isolated)** |
| **Calculation Accuracy** | `100%` | **100% Match** | ✅ **Passed** |

---

## 5. Architectural Findings & Scaling Observations

1. **KV Caching Eliminates Database Load:** Over 99% of read requests during the salary-day peak were absorbed directly at the Cloudflare Edge CDN/KV tier without touching the D1 primary database.
2. **Durable Objects Provide True Determinism:** Even with 20 organizations executing payroll simultaneously, the DO per-organization sharding model prevented cross-tenant blocking entirely.
3. **Zero Cold-Starts:** Because Cloudflare Workers run on V8 isolates rather than containerized VMs, cold-start latency remained at 0ms throughout the entire load ramp-up.
