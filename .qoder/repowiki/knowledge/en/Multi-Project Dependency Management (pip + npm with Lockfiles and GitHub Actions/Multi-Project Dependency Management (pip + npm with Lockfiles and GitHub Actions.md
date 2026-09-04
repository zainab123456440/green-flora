---
kind: dependency_management
name: Multi-Project Dependency Management (pip + npm with Lockfiles and GitHub Actions)
category: dependency_management
scope:
    - '**'
source_files:
    - requirements.txt
    - Scraper/requirements.txt
    - Frontend/greenflora/package.json
    - Frontend/greenflora/package-lock.json
    - .github/workflows/amis-scraper.yml
---

## What system/approach is used

The Green Flora Smart Agriculture Platform manages dependencies across three separate Python/Node projects, each using its native package manager:

- **Backend (FastAPI)**: `requirements.txt` at the repository root pins every dependency to an exact version (e.g. `fastapi==0.115.6`, `uvicorn[standard]==0.34.0`, `supabase==2.11.0`, `google-generativeai==0.8.5`, `openai==3.7.0`). No virtual environment or lockfile is committed; installation is via `pip install -r requirements.txt`.
- **Scraper**: A separate `Scraper/requirements.txt` declares loose constraints (`requests>=2.31.0`, `beautifulsoup4>=4.12.0`, `supabase>=2.11.0`, `python-dotenv>=1.0.1`) using `>=` ranges rather than exact pins.
- **Frontend (Next.js)**: `Frontend/greenflora/package.json` declares runtime and dev dependencies with caret ranges (`^1.9.22`, `^4`, etc.), and a `package-lock.json` (lockfileVersion 3) is committed alongside it, pinning the full transitive dependency tree for reproducible installs.

There is no monorepo-level manifest — each subproject owns its own dependency file independently.

## Key files and packages

- `requirements.txt` (repo root) — Backend FastAPI dependencies, all pinned to exact versions.
- `Scraper/requirements.txt` — AMIS scraper dependencies, declared with minimum-version ranges.
- `Frontend/greenflora/package.json` — Frontend dependency declarations (Next.js 16, React 19, Leaflet, Recharts, Tailwind v4, TypeScript v5, ESLint v9).
- `Frontend/greenflora/package-lock.json` — Full deterministic lockfile for the frontend, committed to version control.
- `.github/workflows/amis-scraper.yml` — CI workflow that installs the scraper's `requirements.txt` via `pip install -r Scraper/requirements.txt` on `ubuntu-latest` with Python 3.11.
- `node_modules/` — The frontend has a checked-in `node_modules` directory (not ideal practice), which duplicates what `package-lock.json` would normally generate.

## Architecture and conventions

- **Per-project manifests**: Each component (backend, scraper, frontend) maintains its own dependency declaration in the conventional location for its ecosystem. There is no shared workspace or tool like Poetry, pip-tools, pnpm, or Yarn workspaces.
- **Pin strategy differs by project**: The backend uses strict exact pins (`==`) to freeze the build, while the scraper uses permissive minimums (`>=`) so it can pull newer compatible releases. The frontend uses caret ranges (`^`) in `package.json` and relies on `package-lock.json` for determinism.
- **No vendoring**: Dependencies are not vendored into the repo except for the frontend's `node_modules/`, which appears to be committed directly rather than generated from the lockfile during CI.
- **No private registries**: All dependencies resolve against the public PyPI registry and the public npm registry; there is no `.pypirc`, `pip.conf`, `.npmrc`, or `package.json` `registry` field pointing to a private source.
- **Environment variables for secrets**: Runtime secrets (Supabase URL/service key, API keys) are loaded via `python-dotenv` from `.env` files and injected through GitHub Actions secrets in the CI workflow — they are not part of the dependency graph.

## Conventions and constraints

- **Backend dependencies must be pinned exactly** in `requirements.txt`. Every line uses `package==version` format, ensuring reproducible backend builds.
- **Scraper dependencies use minimum-version ranges** (`>=`) in `Scraper/requirements.txt`, allowing automatic upgrades within major versions.
- **Frontend dependencies are managed with npm**: `package.json` declares semver ranges, and `package-lock.json` is committed to guarantee identical installs across environments. Scripts `dev`, `build`, `start`, and `lint` are defined for standard npm workflows.
- **CI installs only the scraper's requirements**: The GitHub Actions workflow explicitly runs `pip install -r Scraper/requirements.txt`; the backend's `requirements.txt` is not installed in CI as part of this workflow.
- **Python version is fixed in CI**: The workflow pins Python 3.11 via `actions/setup-python@v5` with `python-version: '3.11'`.
- **No global/shared dependency file exists**: There is no top-level `pyproject.toml`, `Pipfile`, `poetry.lock`, or equivalent that coordinates dependencies across the backend and scraper.
- **Frontend `node_modules` is committed**: The presence of a large `node_modules/` directory alongside `package-lock.json` means the frontend does not rely solely on lockfile-based resolution during checkout.