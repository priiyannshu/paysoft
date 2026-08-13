# Phase 0 — Setup & Foundations (Execution Plan)

> **Branch:** `layer/00-setup` · **Owns:** Layers 5 + 7 · **Depends on:** nothing
> **Goal:** A GitHub repo grown from the genome skeleton, with a hello-world Worker live on Cloudflare and a CI/CD pipeline that deploys `main` automatically.

---

## Working Model (applies to this phase)

| Activity | Who does it |
|:---------|:-----------|
| Write `wrangler.jsonc` | **User** (with agent guidance) |
| Write `app/cf-worker/index.ts` | **User** |
| Write `package.json` | **User** |
| Write `app/pwa/index.html` (placeholder) | **User** |
| Write `.github/workflows/deploy.yml` | Agent |
| Write `tsconfig.json` | Agent |
| Write `vitest.config.ts` | Agent |
| Write `eslint.config.js` | Agent |
| Write issue templates | Agent |
| Write `app/cf-worker/lib/version.ts` | Agent |
| Run `pnpm install` | **User** |
| Run `wrangler d1 create paysoft` | **User** |
| Run `gh repo create` | **User** |
| Run `gh secret set` (x2) | **User** |
| Run `gh api` branch protection | **User** |
| Run `git branch` + `git push --all` | **User** |

---

## Step-by-Step Execution

### Step 1: Grow the organism in place

This folder IS the repo. No new directory is created.

1. Copy `skeleton/` contents to project root.
2. Move existing artifacts into genome locations:
   - `BUILD_PROCESS_13_LAYERS.md` → `docs/blueprint.md`
   - `diagrams/` → `docs/diagrams/` (if they existed)
   - `screenshots/` → `app/content/visuals/v1/`
   - `MASTER_PLAN.md` → `docs/master-plan.md`
   - `BUILD_PROCESS_13_LAYERS.html` → `archive/`
   - `MASTER_PLAN.html` → `archive/`
3. Move now-empty `skeleton/` into `archive/`.
4. Fill `docs/plan.md` from the blueprint (organism identity, schema, API surface, PWA surface, R2 usage).
5. Update `AGENTS.md` placeholders: `{{APP_NAME}}` = `paysoft`, positioning line.

### Step 2: Write `package.json`

**Who:** User writes this. Every field explained:

```jsonc
{
  "name": "paysoft",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",              // local dev server
    "build": "wrangler deploy --dry-run", // validate without deploying
    "build:pwa": "echo 'placeholder — Astro build lands in Phase 4'",
    "deploy": "wrangler deploy",         // deploy to Cloudflare
    "test": "vitest run",                 // run test suite
    "test:watch": "vitest",               // watch mode
    "lint": "eslint app/",                // lint check
    "typecheck": "tsc --noEmit",          // type check without emitting
    "db:migrate": "wrangler d1 migrations apply paysoft --local",
    "db:migrate:remote": "wrangler d1 migrations apply paysoft --remote"
  },
  "dependencies": {
    "hono": "^4.0.0"                      // HTTP router for edge
  },
  "devDependencies": {
    "@cloudflare/vitest-pool-workers": "^0.5.0",  // test runner for Workers
    "@cloudflare/workers-types": "^4.20240101.0",  // Workers type defs
    "drizzle-orm": "^0.36.0",             // ORM for D1
    "drizzle-kit": "^0.28.0",             // migration generator
    "eslint": "^9.0.0",
    "@eslint/js": "^9.0.0",
    "typescript": "^5.6.0",
    "vitest": "^2.0.0",
    "wrangler": "^4.0.0"
  }
}
```

**What to understand:**
- `dev` uses `wrangler dev` — runs the Worker locally with hot reload
- `deploy` uses `wrangler deploy` — pushes to Cloudflare's edge
- `test` uses vitest with the Cloudflare pool — tests run against a simulated Worker environment
- `db:migrate` / `db:migrate:remote` apply D1 migrations locally or to the real cloud database

### Step 3: Write `wrangler.jsonc`

**Who:** User writes this. The binding configuration is the contract between the Worker and Cloudflare resources.

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "paysoft",
  "main": "app/cf-worker/index.ts",
  "compatibility_date": "2026-01-01",
  "compatibility_flags": ["nodejs_compat"],

  // The D1 database — ID filled in after `wrangler d1 create`
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "paysoft",
      "database_id": "FILL_AFTER_CREATE",
      "migrations_dir": "app/pipeline/migrations"
    }
  ],

  // Static assets — serves app/pwa/ at the root URL
  "assets": {
    "directory": "./app/pwa"
  }
}
```

**What to understand:**
- `main` — the entry point Cloudflare loads. Must match the actual file path.
- `compatibility_date` — pins the Workers runtime version. Update quarterly.
- `compatibility_flags: ["nodejs_compat"]` — enables Node.js built-ins (crypto, path, etc.).
- `d1_databases[0].binding` — the name your code uses: `env.DB`. Must match what `index.ts` expects.
- `d1_databases[0].database_id` — the UUID Cloudflare assigns. You get this from `wrangler d1 create`.
- `d1_databases[0].migrations_dir` — where Drizzle migration SQL files live.
- `assets.directory` — the Worker serves these files at `/`. In Phase 4, this becomes `./app/pwa/dist`.

### Step 4: Write `app/cf-worker/index.ts`

**Who:** User writes this. The entry point.

```typescript
import { Hono } from 'hono'

const app = Hono<{ Bindings: Env }>()

app.get('/api/health', (c) => {
  return c.json({ ok: true, version: '2.0.0' })
})

export default app
```

**What to understand:**
- `Hono<{ Bindings: Env }>` — TypeScript generics so `c.env.DB` is typed.
- `GET /api/health` — the smoke test endpoint CI curls after deploy.
- `export default app` — Workers expects a default export with a `fetch` handler (Hono provides this).

The `Env` type will be generated by `wrangler types` after the first deploy. Until then, it can be defined manually:

```typescript
interface Env {
  DB: D1Database
  ASSETS: Fetcher  // provided by the assets binding
}
```

### Step 5: Write `app/pwa/index.html`

**Who:** User writes this. A placeholder until Phase 4.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PaySoft v2</title>
</head>
<body>
  <h1>PaySoft v2</h1>
  <p>Building...</p>
</body>
</html>
```

**What to understand:**
- The Worker serves this file at `/` via the `ASSETS` binding.
- In Phase 4, Astro builds to `app/pwa/dist/` and the binding directory changes.

### Step 6: Agent writes CI/CD + tooling config

Files written by the agent (user reviews):

**`.github/workflows/deploy.yml`:**
- On push/PR: install → lint → typecheck → test
- On PR: build + deploy a preview Worker (`paysoft-preview`)
- On push to `main`: deploy production + run migrations + smoke test

**`tsconfig.json`:**
- Target ES2022, moduleResolution bundler, strict mode, types from `@cloudflare/workers-types`

**`vitest.config.ts`:**
- Uses `@cloudflare/vitest-pool-workers/config` so tests run in a Worker-like environment

**`eslint.config.js`:**
- Flat config (ESLint 9+), TypeScript parser

**`.github/ISSUE_TEMPLATE/feature.md` & `bug.md`:**
- Standard templates for the GitHub Projects board

**`app/cf-worker/lib/version.ts`:**
- Exports `APP_VERSION = '2.0.0'`

### Step 7: User runs CLI commands

#### 7a. Install dependencies

```bash
pnpm install
```

**What it does:** Downloads all dependencies from `package.json` into `node_modules/`. Also installs the wrangler binary locally (though you have it globally too).

#### 7b. Create the D1 database

```bash
wrangler d1 create paysoft
```

**What it does:** Creates a new D1 database in your Cloudflare account. Outputs something like:

```
✅ Successfully created DB 'paysoft'!
Created your new D1 database with the following details:
- Database ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Action:** Copy the Database ID. Paste it into `wrangler.jsonc` replacing `FILL_AFTER_CREATE`.

**Why now:** Every later phase needs this DB to exist. Creating it early means all future `wrangler d1` commands work against a real database.

#### 7c. Generate TypeScript types for bindings

```bash
wrangler types
```

**What it does:** Reads `wrangler.jsonc` and generates `worker-configuration.d.ts` with your binding types (so `env.DB` is typed as `D1Database`).

#### 7d. Commit and create the GitHub repo

```bash
git add -A
git commit -m "Phase 0: setup skeleton, D1, CI/CD"
git branch -M main
gh repo create paysoft --private --source=. --push
```

**What it does:** Creates a private GitHub repo named `paysoft` and pushes the current branch.

**Action:** After this, the repo exists at `https://github.com/<you>/paysoft`.

#### 7e. Set GitHub secrets

```bash
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
```

**What it does:** Stores encrypted secrets that GitHub Actions uses to deploy. `wrangler deploy` in CI needs these to authenticate.

**How to get the values:**
- `CLOUDFLARE_API_TOKEN` — Create at https://dash.cloudflare.com/profile/api-tokens with "Edit Workers" permission
- `CLOUDFLARE_ACCOUNT_ID` — Found in the Cloudflare dashboard URL or via `wrangler whoami`

#### 7f. Set branch protection on `main`

```bash
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["test"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null
```

**What it does:** Makes `main` protected:
- No direct pushes — everything goes through a PR
- The `test` CI job must pass before merge
- The branch must be up to date with `main` before merge
- At least 1 approving review required

#### 7g. Create the 12 layer branches

```bash
git branch layer/00-setup
git branch layer/03-database
git branch layer/04-auth
git branch layer/02-backend
git branch layer/01-frontend
git branch layer/06-compute
git branch layer/10-caching
git branch layer/08-security
git branch layer/09-rate-limiting
git branch layer/12-logging
git branch layer/13-availability
git branch layer/11-scaling
git push --all
```

**What it does:** Creates all 12 layer branches (cut from current `main`) and pushes them to GitHub. These are long-lived — they persist forever as the project's mental model in git.

**Why now:** The plan says cut them all at once so the full layer model is visible from day one. Each phase checks out its own branch when it starts.

---

## What You'll Understand After Phase 0

1. **How a Worker serves static assets** — the `assets.binding` in `wrangler.jsonc` tells the Worker to serve files from a directory. Requests to `/` get the HTML; requests to `/api/*` get routed by Hono.

2. **How wrangler binds a D1 database** — the `d1_databases` array declares a binding named `DB`. In code, `env.DB` is a `D1Database` instance with `.prepare()`, `.batch()`, `.exec()` methods.

3. **How GitHub Actions deploys via wrangler** — the workflow uses `cloudflare/wrangler-action` which authenticates with the secrets you set, then runs `wrangler deploy`. On push to `main`, it also runs migrations and curls `/api/health`.

4. **Why branch protection makes `main` trustworthy** — no one can push directly. Every change goes through a PR. CI must pass. This means `main` is always deployable — the foundation of the whole branch model.

5. **The deploy flow:** `git push` → GitHub Actions → `wrangler deploy` → Cloudflare edge → live globally in seconds.

---

## Definition of Done

- [ ] `git push` to `main` → CI green → `https://paysoft.<subdomain>.workers.dev/api/health` returns `{ ok: true, version: '2.0.0' }`
- [ ] A test PR gets a preview deployment and cannot merge with failing checks
- [ ] `wrangler d1 execute paysoft --remote --command "SELECT 1"` succeeds (database exists and is queryable)
- [ ] All 12 `layer/*` branches exist on GitHub
- [ ] `main` is protected (PR required, CI must pass, up-to-date required)
- [ ] `docs/plan.md` is filled; skeleton artifacts live in their genome locations
- [ ] Repo is at `github.com/<you>/paysoft`

**Merge:** PR `layer/00-setup` → `main`. Keep the branch forever — it remains the owner of hosting + CI/CD changes.
