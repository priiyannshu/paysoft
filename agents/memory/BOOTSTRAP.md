# Post-Clone Bootstrap Checklist

This checklist contains the necessary initialization steps for a newly grown organism after cloning from the genome.

## Prerequisites (device-level, one-time)

Before working with any organism, ensure the local environment is properly seeded:
- Node.js v22+ installed
- pnpm installed globally (`npm install -g pnpm`)
- gh CLI installed and authenticated
- wrangler installed globally and authenticated (`npm install -g wrangler`, `wrangler login`)
- A coding CLI installed (any: Antigravity, Claude Code, OpenCode, Cursor, etc.)

## Repo setup (per clone)

Upon cloning a new organism, run through this metabolic startup sequence:
- `pnpm install`
- `python3 -m venv .venv && source .venv/bin/activate` (if Python pipelines exist)
- `pip install -r requirements.txt` (if exists)
- Check session state: which docs exist? (plan.md, scaffold files, build.md)
- Read AGENTS.md for project briefing
