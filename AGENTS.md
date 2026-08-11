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

Check the existence of specific artifacts to determine the current session state:

- **Session 1 (PLAN):** No `docs/plan.md` exists. Goal: help the human define the application and populate `app/data/raw/`.
- **Session 2 (SCAFFOLD):** `docs/plan.md` exists, but the codebase lacks a semantic scaffold. Goal: create Level 2 files containing only plain-language descriptions of their future code. Do not write implementation code.
- **Session 3 (REVIEW):** Semantic scaffold exists, but no `docs/build.md`. Goal: assist the human in reviewing the scaffold and writing the execution plan.
- **Session 4 (BUILD):** `docs/build.md` exists. Goal: write the actual code based on the execution plan and the semantic scaffold. Aim for a working deployment (`wrangler deploy`).
- **Session 5+ (EVOLVE):** A working deployment exists. Goal: iterative improvement, bug fixing, or feature expansion.

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
