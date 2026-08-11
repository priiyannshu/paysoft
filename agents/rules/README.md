# Skeleton Rules

This directory contains the agent rules for this organism. Rules are loaded via the `instructions` field in `opencode.json` and apply path-scoped constraints.

## Rules

- `cf-worker.md` — Conventions for the Cloudflare Worker under `app/cf-worker/`
- `python-pipeline.md` — Conventions for Python data-pipeline scripts under `app/pipeline/`

## Adding Rules

Create a new `.md` file in this directory. Include YAML frontmatter with `paths` to scope when the rule activates:

```yaml
---
name: my-rule
description: What this rule enforces
paths: ["app/pwa/**/*.js"]
---
# Rule content
```

Rules are automatically loaded by opencode when you work on matching files.
