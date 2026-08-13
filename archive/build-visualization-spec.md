# PaySoft v2 — Build Visualization Spec

> **Purpose:** This document is the complete data model and layout specification for an interactive HTML visualization of the entire PaySoft v2 build. A multimodal agent will read this file and generate `app/content/visuals/build-map.html`.
>
> **The visualization is:**
> - A living map of every file, component, and resource in the application
> - Color-coded: **green = built**, **gray = pending**, **blue = infrastructure/external**
> - Toggleable by `layer/*` branch — clicking a branch highlights only its components
> - Clickable nodes that show: file path, what calls it, what it calls, status
> - Updated after each phase completes (re-run the agent, it recolors)

---

## 1. Data Model (the JSON that powers the visualization)

The HTML embeds this as a JavaScript object. Each node has:

```typescript
interface Node {
  id: string           // unique identifier
  label: string        // display name
  type: 'file' | 'binding' | 'service' | 'branch' | 'engine' | 'table' | 'route' | 'external'
  path?: string        // file path (for file nodes)
  branch: string       // which layer/branch owns this
  phase: number        // which phase creates it (0-11)
  status: 'done' | 'pending'
  dependsOn: string[]  // ids of nodes this depends on
  description: string  // tooltip text
}

interface Connection {
  from: string         // node id
  to: string           // node id
  label: string        // what the connection represents
  type: 'calls' | 'imports' | 'binds' | 'writes' | 'reads' | 'serves' | 'deploys'
}
```

---

## 2. Complete Node Inventory

### Phase 0 — Setup & Foundations (`layer/00-setup`) DONE

| id | label | type | path | dependsOn |
|:---|:-----|:-----|:-----|:----------|
| `pkg-json` | package.json | file | `package.json` | — |
| `wrangler-cfg` | wrangler.jsonc | file | `wrangler.jsonc` | — |
| `ts-config` | tsconfig.json | file | `tsconfig.json` | — |
| `vitest-config` | vitest.config.ts | file | `vitest.config.ts` | `pkg-json` |
| `eslint-config` | eslint.config.js | file | `eslint.config.js` | `pkg-json` |
| `worker-entry` | index.ts | file | `app/cf-worker/index.ts` | `pkg-json`, `wrangler-cfg` |
| `pwa-placeholder` | index.html | file | `app/pwa/index.html` | `wrangler-cfg` |
| `version-ts` | version.ts | file | `app/cf-worker/lib/version.ts` | — |
| `ci-workflow` | deploy.yml | file | `.github/workflows/deploy.yml` | — |
| `issue-feature` | feature.md | file | `.github/ISSUE_TEMPLATE/feature.md` | — |
| `issue-bug` | bug.md | file | `.github/ISSUE_TEMPLATE/bug.md` | — |
| `d1-database` | paysoft (D1) | binding | — | `wrangler-cfg` |
| `assets-binding` | ASSETS | binding | — | `wrangler-cfg` |
| `db-binding` | DB | binding | — | `wrangler-cfg` |
| `main-branch` | main | branch | — | — |
| `setup-branch` | layer/00-setup | branch | — | `main-branch` |
| `gh-repo` | GitHub Repo | external | — | — |
| `cf-account` | Cloudflare Account | external | — | — |
| `health-route` | GET /api/health | route | — | `worker-entry` |

### Phase 1 — Database & Storage (`layer/03-database`)

| id | label | type | path | dependsOn |
|:---|:-----|:-----|:-----|:----------|
| `db-schema` | schema.ts | file | `app/cf-worker/db/schema.ts` | `d1-database` |
| `db-client` | client.ts | file | `app/cf-worker/db/client.ts` | `db-schema` |
| `migration-001` | 0001_initial.sql | file | `app/pipeline/migrations/0001_initial.sql` | `db-schema` |
| `migration-002` | 0002_users_sessions.sql | file | `app/pipeline/migrations/0002_users_sessions.sql` | `migration-001` |
| `repo-employee` | employee.repository.ts | file | `app/cf-worker/db/repositories/employee.repository.ts` | `db-client` |
| `repo-salary` | salary.repository.ts | file | `app/cf-worker/db/repositories/salary.repository.ts` | `db-client` |
| `repo-declaration` | declaration.repository.ts | file | `app/cf-worker/db/repositories/declaration.repository.ts` | `db-client` |
| `repo-leave` | leave.repository.ts | file | `app/cf-worker/db/repositories/leave.repository.ts` | `db-client` |
| `repo-audit` | audit.repository.ts | file | `app/cf-worker/db/repositories/audit.repository.ts` | `db-client` |
| `repo-config` | config.repository.ts | file | `app/cf-worker/db/repositories/config.repository.ts` | `db-client` |
| `seed-script` | seed.py | file | `app/pipeline/scripts/seed.py` | `d1-database` |
| `r2-bucket` | paysoft-uploads (R2) | binding | — | `wrangler-cfg` |
| `orgs-table` | organizations | table | — | `db-schema` |
| `departments-table` | departments | table | — | `db-schema` |
| `employees-table` | employees | table | — | `db-schema` |
| `salary-records-table` | salary_records | table | — | `db-schema` |
| `configurations-table` | configurations | table | — | `db-schema` |
| `audit-logs-table` | audit_logs | table | — | `db-schema` |
| `declarations-table` | declarations | table | — | `db-schema` |
| `leave-records-table` | leave_records | table | — | `db-schema` |
| `users-table` | users | table | — | `db-schema` |
| `sessions-table` | sessions | table | — | `db-schema` |
| `db-branch` | layer/03-database | branch | — | `main-branch` |

### Phase 2 — Auth & Permissions (`layer/04-auth`)

| id | label | type | path | dependsOn |
|:---|:-----|:-----|:-----|:----------|
| `lucia-ts` | lucia.ts | file | `app/cf-worker/auth/lucia.ts` | `db-client`, `sessions-table` |
| `sessions-ts` | sessions.ts | file | `app/cf-worker/auth/sessions.ts` | `lucia-ts` |
| `rbac-ts` | rbac.ts | file | `app/cf-worker/auth/rbac.ts` | `sessions-ts` |
| `org-middleware` | org-id.ts | file | `app/cf-worker/middleware/org-id.ts` | `sessions-ts` |
| `auth-login` | POST /auth/login | route | — | `lucia-ts`, `users-table` |
| `auth-logout` | POST /auth/logout | route | — | `sessions-ts` |
| `auth-me` | GET /auth/me | route | — | `sessions-ts` |
| `auth-refresh` | POST /auth/refresh | route | — | `sessions-ts` |
| `auth-branch` | layer/04-auth | branch | — | `main-branch` |

### Phase 3 — Backend Engines (`layer/02-backend`)

| id | label | type | path | dependsOn |
|:---|:-----|:-----|:-----|:----------|
| `engine-1-auth` | Engine 1: Auth | engine | `app/cf-worker/engines/1-auth/` | `rbac-ts` |
| `engine-2-audit` | Engine 2: Smart Audit | engine | `app/cf-worker/engines/2-audit/` | `repo-employee`, `repo-audit` |
| `engine-3-tax` | Engine 3: Tax Math | engine | `app/cf-worker/engines/3-tax/` | — |
| `engine-4-payroll` | Engine 4: Payroll | engine | `app/cf-worker/engines/4-payroll/` | `engine-3-tax`, `payroll-do`, `repo-salary` |
| `engine-5-ess` | Engine 5: ESS | engine | `app/cf-worker/engines/5-ess/` | `engine-3-tax`, `repo-declaration`, `repo-leave` |
| `engine-6-docs` | Engine 6: Documents | engine | `app/cf-worker/engines/6-docs/` | `r2-bucket`, `repo-salary` |
| `engine-7-notify` | Engine 7: Notify | engine | `app/cf-worker/engines/7-notify/` | `notifier-binding` |
| `payroll-do` | PayrollRunLock DO | service | `app/cf-worker/durable-objects/PayrollRunLock.ts` | `d1-database` |
| `notifier-binding` | send_email | binding | — | `wrangler-cfg` |
| `error-boundary` | error-boundary.ts | file | `app/cf-worker/middleware/error-boundary.ts` | — |
| `rpc-types` | RPC Types | file | exports from `app/cf-worker/index.ts` | all engines |
| `backend-branch` | layer/02-backend | branch | — | `main-branch` |

### Phase 4 — Frontend (`layer/01-frontend`)

| id | label | type | path | dependsOn |
|:---|:-----|:-----|:-----|:----------|
| `astro-config` | astro.config.mjs | file | `app/pwa/astro.config.mjs` | `worker-entry` |
| `pwa-layout` | Layout.astro | file | `app/pwa/src/layouts/Layout.astro` | `astro-config` |
| `page-login` | login.astro | file | `app/pwa/src/pages/login.astro` | `rpc-types` |
| `page-dashboard` | dashboard.astro | file | `app/pwa/src/pages/dashboard.astro` | `rpc-types` |
| `page-employees` | employees.astro | file | `app/pwa/src/pages/employees.astro` | `rpc-types` |
| `page-employee-detail` | employees/[id].astro | file | `app/pwa/src/pages/employees/[id].astro` | `rpc-types` |
| `page-salary-stats` | salary-stats.astro | file | `app/pwa/src/pages/salary-stats.astro` | `rpc-types` |
| `page-annual` | annual-statements.astro | file | `app/pwa/src/pages/annual-statements.astro` | `rpc-types` |
| `page-reports` | reports.astro | file | `app/pwa/src/pages/reports.astro` | `rpc-types` |
| `page-ess` | ess.astro | file | `app/pwa/src/pages/ess.astro` | `rpc-types` |
| `page-admin` | admin.astro | file | `app/pwa/src/pages/admin.astro` | `rpc-types` |
| `island-audit` | AuditChecklist.tsx | file | `app/pwa/src/components/islands/AuditChecklist.tsx` | `rpc-types` |
| `island-tax` | TaxCalculator.tsx | file | `app/pwa/src/components/islands/TaxCalculator.tsx` | `rpc-types` |
| `island-table` | DataTable.tsx | file | `app/pwa/src/components/islands/DataTable.tsx` | `rpc-types` |
| `island-charts` | TrendChart.tsx | file | `app/pwa/src/components/islands/TrendChart.tsx` | `rpc-types` |
| `island-chatbot` | ChatbotShell.tsx | file | `app/pwa/src/components/islands/ChatbotShell.tsx` | `rpc-types` |
| `assets-dist` | app/pwa/dist/ | file | — | `astro-config` |
| `frontend-branch` | layer/01-frontend | branch | — | `main-branch` |

### Phase 5 — Cloud & Compute (`layer/06-compute`)

| id | label | type | path | dependsOn |
|:---|:-----|:-----|:-----|:----------|
| `queue-binding` | paysoft-jobs | binding | — | `wrangler-cfg` |
| `queue-producer` | producer.ts | file | `app/cf-worker/queues/producer.ts` | `queue-binding` |
| `queue-consumer` | consumer.ts | file | `app/cf-worker/queues/consumer.ts` | `queue-binding`, `engine-6-docs`, `engine-7-notify` |
| `vectorize-binding` | paysoft-knowledge | binding | — | `wrangler-cfg` |
| `chatbot-ts` | chatbot.ts | file | `app/cf-worker/ai/chatbot.ts` | `vectorize-binding`, `island-chatbot` |
| `chatbot-route` | POST /ai/chat | route | — | `chatbot-ts` |
| `ai-binding` | AI | binding | — | `wrangler-cfg` |
| `vectorize-script` | ingest.py | file | `app/pipeline/scripts/ingest.py` | `vectorize-binding` |
| `compute-branch` | layer/06-compute | branch | — | `main-branch` |

### Phase 6 — Caching & CDN (`layer/10-caching`)

| id | label | type | path | dependsOn |
|:---|:-----|:-----|:-----|:----------|
| `kv-binding` | paysoft-cache | binding | — | `wrangler-cfg` |
| `cache-ts` | index.ts | file | `app/cf-worker/cache/index.ts` | `kv-binding` |
| `caching-branch` | layer/10-caching | branch | — | `main-branch` |

### Phase 7 — Security & RLS (`layer/08-security`)

| id | label | type | path | dependsOn |
|:---|:-----|:-----|:-----|:----------|
| `turnstile-ts` | turnstile.ts | file | `app/cf-worker/security/turnstile.ts` | `wrangler-cfg` |
| `security-headers` | headers.ts | file | `app/cf-worker/security/headers.ts` | — |
| `zod-schemas` | schemas.ts | file | `app/cf-worker/security/schemas.ts` | — |
| `security-branch` | layer/08-security | branch | — | `main-branch` |

### Phase 8 — Rate-Limiting (`layer/09-rate-limiting`)

| id | label | type | path | dependsOn |
|:---|:-----|:-----|:-----|:----------|
| `rate-limit` | rate-limit.ts | file | `app/cf-worker/middleware/rate-limit.ts` | `kv-binding` |
| `load-test` | load-test.mjs | file | `app/pipeline/scripts/load-test.mjs` | — |
| `rate-branch` | layer/09-rate-limiting | branch | — | `main-branch` |

### Phase 9 — Error Tracking & Logs (`layer/12-logging`)

| id | label | type | path | dependsOn |
|:---|:-----|:-----|:-----|:----------|
| `logging-ts` | logging.ts | file | `app/cf-worker/lib/logging.ts` | — |
| `log-viewer` | LogViewer.tsx | file | `app/pwa/src/components/islands/LogViewer.tsx` | `rpc-types` |
| `logging-branch` | layer/12-logging | branch | — | `main-branch` |

### Phase 10 — Availability & Recovery (`layer/13-availability`)

| id | label | type | path | dependsOn |
|:---|:-----|:-----|:-----|:----------|
| `runbook` | runbook.md | file | `docs/runbook.md` | — |
| `cron-binding` | CRON | binding | — | `wrangler-cfg` |
| `availability-branch` | layer/13-availability | branch | — | `main-branch` |

### Phase 11 — Load Balancing & Scaling (`layer/11-scaling`)

| id | label | type | path | dependsOn |
|:---|:-----|:-----|:-----|:----------|
| `scaling-doc` | scaling.md | file | `docs/scaling.md` | — |
| `scaling-branch` | layer/11-scaling | branch | — | `main-branch` |

---

## 3. Connections (the edges between nodes)

These define what calls what. The visualization renders these as arrows.

| from | to | label | type |
|:-----|:---|:-----|:----|
| `pkg-json` | `worker-entry` | imports hono | imports |
| `wrangler-cfg` | `d1-database` | declares binding | binds |
| `wrangler-cfg` | `assets-binding` | serves static | binds |
| `wrangler-cfg` | `db-binding` | env.DB | binds |
| `worker-entry` | `health-route` | defines | serves |
| `worker-entry` | `db-binding` | uses | calls |
| `ts-config` | `worker-entry` | compiles | imports |
| `db-client` | `d1-database` | connects | calls |
| `db-schema` | `org-client` | imports schema | imports |
| `db-schema` | `orgs-table` | defines | writes |
| `db-schema` | `employees-table` | defines | writes |
| `db-schema` | `salary-records-table` | defines | writes |
| `db-schema` | `audit-logs-table` | defines | writes |
| `db-schema` | `declarations-table` | defines | writes |
| `db-schema` | `leave-records-table` | defines | writes |
| `db-schema` | `users-table` | defines | writes |
| `db-schema` | `sessions-table` | defines | writes |
| `migration-001` | `db-schema` | generated from | imports |
| `repo-employee` | `employees-table` | queries | reads |
| `repo-salary` | `salary-records-table` | queries | reads |
| `repo-declaration` | `declarations-table` | queries | reads |
| `repo-leave` | `leave-records-table` | queries | reads |
| `repo-audit` | `audit-logs-table` | writes | writes |
| `seed-script` | `d1-database` | inserts 385 rows | writes |
| `lucia-ts` | `sessions-table` | manages | writes |
| `sessions-ts` | `lucia-ts` | uses | calls |
| `rbac-ts` | `sessions-ts` | reads role | reads |
| `org-middleware` | `sessions-ts` | extracts org_id | reads |
| `engine-1-auth` | `rbac-ts` | uses | calls |
| `engine-2-audit` | `repo-employee` | calls | calls |
| `engine-4-payroll` | `engine-3-tax` | calls | calls |
| `engine-4-payroll` | `payroll-do` | acquires lock | calls |
| `engine-5-ess` | `engine-3-tax` | calls | calls |
| `engine-6-docs` | `r2-bucket` | stores PDFs | writes |
| `engine-7-notify` | `notifier-binding` | sends email | calls |
| `payroll-do` | `d1-database` | persists state | writes |
| `queue-producer` | `queue-binding` | enqueues | writes |
| `queue-consumer` | `engine-6-docs` | calls for PDFs | calls |
| `chatbot-ts` | `vectorize-binding` | queries | reads |
| `chatbot-ts` | `ai-binding` | inference | calls |
| `cache-ts` | `kv-binding` | read-through | reads |
| `rate-limit` | `kv-binding` | counts | writes |
| `turnstile-ts` | `wrangler-cfg` | siteverify | calls |
| `astro-config` | `worker-entry` | calls API | calls |
| `error-boundary` | `worker-entry` | wraps all routes | imports |
| `logging-ts` | `worker-entry` | used by all | imports |

---

## 4. Visual Layout Specification

### Canvas Structure

The HTML uses a layered left-to-right flow (recommended for legibility over force-directed).

```
+--------------------------------------------------------------------+
|  HEADER: PaySoft v2 — Build Map       [Phase 0 of 11 complete]     |
|  [Green: Built] [Gray: Pending] [Blue: External]                   |
+--------------------------------------------------------------------+
|                                                                    |
|  SIDEBAR                │  MAIN CANVAS (scrollable)                |
|  +--------------------+  │  +------------------------------------+  |
|  │ BRANCH TOGGLES     │  │  │                                    │  |
|  │  [x] layer/00-setup│  │  │  Phase 0 > Phase 1 > ... > P11    │  |
|  │  [ ] layer/03-db   │  │  │                                    │  |
|  │  [ ] layer/04-auth │  │  │  [nodes as boxes/circles          │  |
|  │  [ ] layer/02-be   │  │  │   colored by status,               │  |
|  │  [ ] layer/01-fe   │  │  │   connected by arrows]             │  |
|  │  [ ] layer/06-cmp  │  │  │                                    │  |
|  │  [ ] layer/10-cch  │  │  │                                    │  |
|  │  [ ] layer/08-sec  │  │  │                                    │  |
|  │  [ ] layer/09-rl   │  │  │                                    │  |
|  │  [ ] layer/12-log  │  │  │                                    │  |
|  │  [ ] layer/13-avail│  │  │                                    │  |
|  │  [ ] layer/11-scale│  │  │                                    │  |
|  │                    │  │  │                                    │  |
|  │ STATUS FILTER      │  │  │                                    │  |
|  │  [x] Built         │  │  │                                    │  |
|  │  [x] Pending       │  │  │                                    │  |
|  │  [x] External      │  │  │                                    │  |
|  │                    │  │  │                                    │  |
|  │ PROGRESS           │  │  │                                    │  |
|  │  Phase 0 ████ 8%   │  │  │                                    │  |
|  │  Phase 1 ░░░░  0%  │  │  │                                    │  |
|  │  ...               │  │  │                                    │  |
|  └────────────────────┘  │  └────────────────────────────────────┘  |
+--------------------------------------------------------------------+
|  FOOTER: Click node for details │ Hover for tooltip               |
+--------------------------------------------------------------------+
```

### Node Styling

| type | shape | color (done) | color (pending) |
|:-----|:------|:-------------|:----------------|
| file | rectangle | green #22c55e | gray #6b7280 |
| binding | diamond | blue #3b82f6 | gray #6b7280 |
| service | hexagon | purple #8b5cf6 | gray #6b7280 |
| branch | rounded rect | amber #f59e0b | amber #f59e0b |
| engine | large rect | green #22c55e | gray #6b7280 |
| table | ellipse | teal #14b8a6 | gray #6b7280 |
| route | small circle | cyan #06b6d4 | gray #6b7280 |
| external | cloud shape | blue #3b82f6 | blue #3b82f6 |

### Interactions

1. **Click node** → side panel shows: file path, description, what it depends on, what depends on it, branch owner, phase
2. **Toggle branch** → all nodes owned by that branch highlight, others dim
3. **Filter by status** → show/hide built/pending/external
4. **Hover** → tooltip with description
5. **Zoom/pan** → for large canvas

### Technology Recommendation

Use **D3.js** or **Cytoscape.js** for the graph rendering. Embed everything in a single self-contained HTML file (no external CDN dependencies — this file will be served from the Worker's ASSETS binding and must work offline).

---

## 5. Updating After Each Phase

After a phase completes:
1. Open this spec file
2. Change the phase's nodes from `status: 'pending'` to `status: 'done'`
3. Re-run the multimodal agent to regenerate the HTML
4. The visualization now shows more green, less gray

This makes the visualization a **living document** — it grows with the project.

---

## 7. Build Decisions (recorded before build session)

| Decision | Choice |
|:---------|:-------|
| Initial status | Phase 0 = done (green), all other phases = pending (gray) |
| Missing `org-client` node | Remove connection on line 227 (references non-existent node) |
| Data embedding | Inline JSON directly in HTML (single self-contained file) |
| Layout direction | Vertical columns, left-to-right (Phase 0 left → Phase 11 right) |
| Graph library | Cytoscape.js (inlined, offline-capable) |
| Arrow style | Animated flowing dots |
| Detail panel | Tooltip-style popover near clicked node |
| Connection styling | Color by type (calls, imports, binds, writes, reads, serves, deploys each get distinct color) |

---

## 6. Summary Statistics

| metric | count |
|:-------|:------|
| Total nodes | ~120 |
| Total connections | ~50 |
| Phases | 12 (0-11) |
| Layer branches | 12 |
| Files tracked | ~80 |
| External services | 2 (GitHub, Cloudflare) |
