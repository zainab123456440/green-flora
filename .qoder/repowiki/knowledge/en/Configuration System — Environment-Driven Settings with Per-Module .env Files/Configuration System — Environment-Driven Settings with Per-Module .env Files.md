---
kind: configuration_system
name: Configuration System — Environment-Driven Settings with Per-Module .env Files
category: configuration_system
scope:
    - '**'
source_files:
    - Backend/config/settings.py
    - Backend/config/supabase_client.py
    - Backend/.env
    - Backend/main.py
    - Frontend/greenflora/.env
    - Scraper/config.py
---

# Configuration System

## What system/approach is used

The Green Flora platform uses a **pure environment-variable configuration** approach, with no dedicated config framework (no Pydantic `BaseSettings`, no YAML/JSON/TOML loaders). Each component loads its own `.env` file via the `python-dotenv` library and reads values through `os.getenv`. There are no runtime config files on disk; all secrets and toggles come from environment variables.

## Key files and packages

- **Backend**: `Backend/config/settings.py` — central `Settings` class that loads every backend setting from env vars into a single shared instance (`settings`). `Backend/config/supabase_client.py` — builds the Supabase client using those settings. `Backend/.env` — backend secrets and feature flags.
- **Frontend**: `Frontend/greenflora/.env` — Next.js public env vars (`NEXT_PUBLIC_API_BASE_URL`, `SUPABASE_*`) consumed at build/runtime by the browser bundle.
- **Scraper**: `Scraper/config.py` — module-level constants loaded from a local `.env` via `load_dotenv(Path(__file__).resolve().parent / ".env")`; also defines non-secret defaults like AMIS URLs, HTTP timeouts, retry/backoff, batch size, table names, and ingestion source.
- **App bootstrap**: `Backend/main.py` wires FastAPI with CORS origins taken from `settings.cors_origins` and mounts routers.

## Architecture and conventions

### Backend (`config/settings.py`)

1. **Single shared snapshot**: A `Settings` class is instantiated once at import time as a module-level `settings` object. All other modules import this singleton rather than calling `os.getenv` directly.
2. **Typed helpers for parsing**: `_get_bool` normalizes strings like `"true"/"1"/"yes"/"on"` to Python booleans; `_get_list` splits comma-separated values into lists (used for `CORS_ORIGINS`).
3. **Defaults everywhere**: Every setting has a sensible default (e.g. `DEMO_MODE=True`, `AI_MAIN_MODEL=gpt-5.6-luna`, `AI_STREAM_TIMEOUT_SECONDS=180`, `environment=development`), so the app runs in demo mode without any `.env` present.
4. **Feature-flag style toggles**: `DEMO_MODE` switches services between seeded demo data and real external APIs/database. External API keys are intentionally optional — features degrade gracefully when empty.
5. **Provider-swappable models**: AI models are exposed as env vars (`AI_MAIN_MODEL`, `AI_UTILITY_MODEL`, `AI_TRANSCRIBE_MODEL`, `AI_TTS_MODEL`, `AI_FALLBACK_MODEL`) so providers can be swapped without code changes. The fallback model (Gemini) is used when OpenAI is down.
6. **Supabase client guarded by presence**: `supabase_client.py` only creates the client if both `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set; otherwise the global `supabase` stays `None`, allowing graceful degradation.
7. **HTTP tuning per connection**: The Supabase client is built with an explicit `httpx.Client(http2=False)` plus connect/read/write/pool timeouts and connection limits to avoid Windows HTTP/2 socket errors.

### Frontend (`Frontend/greenflora/.env`)

- Uses Next.js convention: only variables prefixed `NEXT_PUBLIC_` are baked into the client bundle. The frontend exposes `NEXT_PUBLIC_API_BASE_URL` (defaulting to `http://localhost:8000`) and Supabase credentials for direct DB access from the browser.
- No TypeScript/JS config loader exists — values are read via `process.env` at runtime.

### Scraper (`Scraper/config.py`)

- Loads `.env` relative to the scraper module's directory, isolating its secrets from the backend.
- Mixes secret env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`) with hard-coded operational constants (AMIS base URL, request timeout, delay, retries, backoff, user agent, batch size, table names, ingestion source).
- Table names are declared as module constants (`TABLE_COMMODITIES`, `TABLE_MARKETS`, `TABLE_RATES`, `TABLE_LOGS`) to enforce schema alignment across the pipeline.

## Conventions and constraints

- **Never hardcode secrets**: Documented rule in `Backend/config/settings.py` referencing project-context.md rules 9–10 — "Never hardcode API keys. Use environment variables for secrets." Enforced by reading everything through `os.getenv`.
- **`.env` files are never committed**: Both `Backend/.env` and `Frontend/greenflora/.env` contain comments explicitly stating they must not be committed; each lives next to the code it belongs to.
- **Demo-first defaults**: `DEMO_MODE` defaults to `True`, so a fresh clone runs against seeded data without any database or API keys configured.
- **Optional external dependencies**: External API keys (OpenWeather, Alibaba OSS, Gemini, OpenAI) default to empty strings; consuming code is expected to handle missing keys gracefully.
- **CORS is configurable per deployment**: `CORS_ORIGINS` is a comma-separated list loaded via `_get_list`, defaulting to `http://localhost:3000` for local dev.
- **Environment identity**: `ENVIRONMENT` env var (default `development`) is captured in `settings.environment` for logging/metadata purposes.
- **Per-component isolation**: Backend, frontend, and scraper each maintain their own `.env` file and load it independently — there is no shared configuration layer across components.