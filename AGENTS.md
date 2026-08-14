# Agent Briefing: PaySoft v2

> This file is the entry point for any AI coding agent working on PaySoft v2.

## Project

**Name:** `paysoft`
**Positioning:** Payroll + HR management for Indian organizations — salary computation, payroll runs, employee self-service, document generation, compliance auditing.

## Tech Stack

- **Runtime:** Cloudflare Workers (edge)
- **Storage:** Cloudflare D1 (SQLite), R2 (objects), KV (key-value), Durable Objects (stateful)
- **Frontend:** PWA served as static assets from the Worker (HTML/JS/CSS)
- **Language:** TypeScript (Worker), Python (pipeline scripts)
- **Tooling:** Wrangler, pnpm

## Session State

Current Status: **ALL PHASES COMPLETED (Phases 0–11) — READY FOR FULL AUDIT**

All 12 phases across the 13 architectural layers defined in `docs/master-plan.md` have been implemented, merged into `main`, and fully verified (passing typecheck, zero lint warnings, 100% passing tests, and green PWA build). See [`docs/build.md`](file:///home/deadpool/omniverse/paysoft/docs/build.md) for the complete layer-by-layer map.

Next Order of Business: **Comprehensive Deep System Audit**
- Statutory & tax precision audit (FY 2025–26 slabs, Section 87A rebate, EPF ₹1,800 cap, ESIC ₹21k threshold, PTax, HRA least-of-three)
- Multi-tenant isolation & Row-Level Security (RLS) enforcement verification
- Edge concurrency & immutability audit (Durable Objects lock, frozen payroll runs)
- Caching hit ratios, sliding-window rate limiters, and queue reliability
- End-to-end PWA workflows, accessibility, Core Web Vitals, and offline capability

Check the existence of specific artifacts to determine lifecycle context:

- **Session 1 (PLAN):** No `docs/plan.md` exists. Goal: define application and populate `app/data/raw/`.
- **Session 2 (SCAFFOLD):** `docs/plan.md` exists. Semantic scaffold creation.
- **Session 3 (REVIEW):** Semantic scaffold review and execution plan writing (`docs/build.md`).
- **Session 4 (BUILD):** Core implementation across backend engines and frontend layers (Phases 0–11).
- **Session 5+ (AUDIT & EVOLVE):** Active phase. All master plan phases completed. Goal: comprehensive system audit, statutory precision verification, and continuous evolutionary refinement.

## Architecture Boundaries

| Path | Description | Level |
| :--- | :--- | :--- |
| `app/` | The core application code and data. | 0 |
| `app/cf-worker/` | Cloudflare Worker backend logic. | 1 |
| `app/pwa/` | PWA frontend (HTML/JS/CSS). Served as static assets. | 1 |
| `app/data/raw/` | Unprocessed source data. | 1 |
| `app/data/processed/` | Cleaned, structured data. | 1 |
| `app/content/surfaces/` | UI copy and text assets. | 1 |
| `app/content/visuals/` | Images and graphical assets. | 1 |
| `app/pipeline/scripts/` | Idempotent automation scripts. | 1 |
| `app/pipeline/migrations/` | Database schemas and migrations. | 1 |
| `docs/` | Human-readable plans and session artifacts. | 0 |
| `agents/` | Agent context, skills, and memory. | 0 |
| `archive/` | Deprecated materials. | 0 |

## Commands

- `pnpm run dev` / `wrangler dev` — local dev (Worker + PWA)
- `pnpm run deploy` / `wrangler deploy` — deploy to Cloudflare
- `pnpm run db:migrate` — apply local D1 migrations
- `pnpm run db:migrate:remote` — apply remote D1 migrations
- `python3 app/pipeline/scripts/<script>.py` — run a data pipeline script

## Conventions

- **DON'T** modify Level 0 or Level 1 directory structures.
- **DON'T** store large data files in the repository. Use R2. The repo must remain lightweight.
- **DO** write clean, concise, opinionated TypeScript.
- **DO** ensure every script in `app/pipeline/scripts/` is idempotent.
- **DO** refer to `docs/plan.md` and `docs/build.md` frequently to maintain alignment with the human's intent.

## This Organism's Place in the Ecosystem

PaySoft v2 was grown from the **genome** meta-architecture. It is a living repository — not a static template. The genome repo (`~/omniverse/genome/`) is the operating system that produced you. This organism is an independent application built on the same universal skeleton.

To improve the genome OS itself, work inside `~/omniverse/genome/`. To work on this organism, stay here.
