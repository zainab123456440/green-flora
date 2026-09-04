---
kind: build_system
name: 'Multi-Project Build & CI: Next.js, FastAPI, and AMIS Scraper with GitHub Actions'
category: build_system
scope:
    - '**'
source_files:
    - .github/workflows/amis-scraper.yml
    - requirements.txt
    - Scraper/requirements.txt
    - Scraper/run.py
    - Frontend/greenflora/package.json
    - Frontend/greenflora/next.config.ts
    - Frontend/greenflora/tsconfig.json
    - Backend/main.py
---

## Overview

The Green Flora platform is a multi-project repository with three independently built components — a Next.js frontend (`Frontend/greenflora`), a FastAPI backend (`Backend`), and a Python market-data scraper (`Scraper`) — each with its own dependency manifest and build process. There is no top-level Makefile or Dockerfile; instead, each component is built and run directly via its native tooling, and only the scraper has an automated CI pipeline.

## Per-Component Build System

### Frontend (Next.js)
- **Toolchain**: Next.js 16.2.11 with React 19, TypeScript 5, Tailwind CSS v4, and ESLint v9.
- **Dependency management**: `package.json` + `package-lock.json` in `Frontend/greenflora/`. Dependencies are pinned by version ranges (e.g. `next: 16.2.11`, `react: 19.2.4`).
- **Scripts** (defined in `package.json`):
  - `npm run dev` → `next dev` for local development.
  - `npm run build` → `next build` for production builds.
  - `npm run start` → `next start` to serve the built app.
  - `npm run lint` → `eslint` for code quality checks.
- **Build configuration**: `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, and `eslint.config.mjs` live alongside the source in `Frontend/greenflora/`.
- **No CI step**: The Next.js app is not built or tested in GitHub Actions in this repo; it appears intended for local development and manual deployment (e.g. to Vercel).

### Backend (FastAPI)
- **Toolchain**: Python 3.x with FastAPI 0.115.6, Uvicorn 0.34.0, Pydantic v2, Supabase client, Google Generative AI, and OpenAI SDK.
- **Dependency management**: Root-level `requirements.txt` pins exact versions (e.g. `fastapi==0.115.6`, `uvicorn[standard]==0.34.0`, `pydantic==2.10.4`). No virtual environment or lock file is committed.
- **Entry point**: `Backend/main.py` starts the FastAPI application; there is no dedicated build step — the app runs as a Python module.
- **No build/test scripts**: No Makefile, no `setup.py`/`pyproject.toml`, no test runner script, and no CI job for the backend.

### Scraper (Python CLI)
- **Toolchain**: Python 3.11 with `requests`, `beautifulsoup4`, `supabase`, and `python-dotenv`.
- **Dependency management**: `Scraper/requirements.txt` uses semver-compatible ranges (`>=` constraints) rather than exact pins.
- **CLI entry point**: `python -m Scraper.run` is the documented invocation, supporting `--dry-run`, `--commodity-ids <list>`, and `--verbose` flags (see `Scraper/run.py`).
- **Pipeline**: `run_pipeline()` in `Scraper/pipeline.py` orchestrates scraping, parsing, and upsert into Supabase.

## CI / Automation

Only one GitHub Actions workflow exists:
- **File**: `.github/workflows/amis-scraper.yml`
- **Name**: "AMIS Daily Market Data Ingestion"
- **Trigger**: Scheduled daily at `0 6 * * *` (06:00 UTC / 11:00 PKT) plus manual `workflow_dispatch`.
- **Runtime**: `ubuntu-latest` with Python 3.11.
- **Steps**:
  1. `actions/checkout@v4`
  2. `actions/setup-python@v5` with `python-version: '3.11'`
  3. `pip install -r Scraper/requirements.txt`
  4. `python -m Scraper.run`
- **Secrets required**: `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (documented in the workflow header).
- **Timeout**: 30 minutes per run.

There is no CI for the Frontend or Backend — no lint, test, build, or deploy steps for those components.

## Conventions and Constraints

- **Per-component isolation**: Each subproject manages its own dependencies and build tooling independently; there is no monorepo orchestration layer (no lerna, nx, make, etc.).
- **Environment variables**: Secrets and runtime config are loaded via `python-dotenv` from `.env` files in both `Backend/` and `Frontend/greenflora/`; CI secrets are injected through GitHub Actions `secrets.*`.
- **Version pinning strategy differs by component**: The root `requirements.txt` pins exact versions (`==`), while `Scraper/requirements.txt` allows compatible upgrades (`>=`); the frontend uses `package.json` version ranges.
- **No containerization**: No `Dockerfile` or `docker-compose.yml` exists in the repository; deployment is assumed to be handled externally (e.g. Vercel for the frontend, a host for the scraper scheduled via GitHub Actions).
- **No shared build artifacts**: Each component produces its own output — Next.js `.next/` build directory, Python `__pycache__/` bytecode, and no cross-component packaging.