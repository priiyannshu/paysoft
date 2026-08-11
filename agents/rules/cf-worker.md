---
name: cf-worker
description: Conventions for the Cloudflare Worker under app/cf-worker/
paths: ["app/cf-worker/**/*.ts"]
---

# Cloudflare Worker conventions

- Entry point: `app/cf-worker/index.ts` (matches `main` in `wrangler.jsonc`).
- Keep route handlers thin; separate router logic from business services.
- Bindings (DB, ASSETS, AI, DO) are declared in `wrangler.jsonc`.
- Static assets are served from `app/pwa` via the `ASSETS` binding — do not hardcode paths.
- Use the `nodejs_compat` flag when relying on Node built-ins.
