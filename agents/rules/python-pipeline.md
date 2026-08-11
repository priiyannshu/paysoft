---
name: python-pipeline
description: Conventions for Python data-pipeline scripts under app/pipeline/
paths: ["app/pipeline/**/*.py"]
---

# Python pipeline conventions

- Scripts under `app/pipeline/` prepare data. They read from `app/data/raw/`
  and write to `app/data/processed/` or generated frontend assets.
- Compute paths relative to the repo root, not the script's own directory:
  `ROOT = Path(__file__).resolve().parent.parent` (when script lives under `app/pipeline/`).
- Never write to `app/data/raw/`. It is immutable source material.
- Generated PWA data or pre-built assets written to `app/pwa/data/` should be gitignored and rebuilt via pipeline scripts.
