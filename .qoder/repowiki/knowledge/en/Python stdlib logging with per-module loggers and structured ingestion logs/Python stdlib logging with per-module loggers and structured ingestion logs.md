---
kind: logging_system
name: Python stdlib logging with per-module loggers and structured ingestion logs
category: logging_system
scope:
    - '**'
source_files:
    - Backend/main.py
    - Backend/routes/auth.py
    - Backend/routes/assistant.py
    - Backend/services/auth_service.py
    - Backend/services/assistant_service.py
    - Scraper/pipeline.py
    - Scraper/db.py
    - Scraper/run.py
---

## What system/approach is used

The repository uses Python's built-in `logging` module exclusively — no third-party logging frameworks (e.g. loguru, structlog, Sentry) are imported anywhere in the codebase. The FastAPI backend and the AMIS scraper pipeline each create a module-level logger via `logger = logging.getLogger(__name__)`, giving each file its own fully-qualified logger name (e.g. `Backend.routes.auth`, `Scraper.pipeline`).

There is **no centralized logging configuration** in the FastAPI app (`Backend/main.py` does not call `logging.basicConfig`, add handlers, or set levels). Uvicorn runs with default stderr output. The only place logging is configured is in the Scraper entry point: `Scraper/run.py` calls `logging.basicConfig(...)` to configure root handlers for the CLI pipeline.

## Key files and packages

- Backend route modules that declare a module logger:
  - `Backend/routes/auth.py`, `Backend/routes/assistant.py`, `Backend/routes/crop_doctor.py`, `Backend/routes/farmer.py`, `Backend/routes/field.py`, `Backend/routes/market.py`, `Backend/routes/support.py`
- Backend service modules that declare a module logger:
  - `Backend/services/auth_service.py`, `Backend/services/assistant_service.py`, `Backend/services/assistant_tools.py`, `Backend/services/crop_doctor_service.py`, `Backend/services/farmer_service.py`, `Backend/services/field_service.py`, `Backend/services/market_service.py`, `Backend/services/support_service.py`
- Scraper pipeline and DB layer:
  - `Scraper/pipeline.py`, `Scraper/db.py`, `Scraper/run.py` (where `logging.basicConfig` is invoked)
- Frontend: no application logging framework is present; the Next.js client relies on browser console APIs (no custom logger abstraction was found).

## Architecture and conventions

1. **Per-module logger instance**: Every Python module that needs to emit logs declares `import logging` followed by `logger = logging.getLogger(__name__)`. This produces hierarchical logger names that map directly to the source file path, making it easy to filter logs by module.

2. **Structured fields via positional arguments**: Log messages use `logger.<level>("message", field1, field2, ...)` with positional parameters rather than string formatting. For example:
   - `logger.info("Upserted %d rate rows (%d skipped).", written, skipped)`
   - `logger.warning("Supabase signup failed: %s", exc)`
   - `logger.error("FATAL: Cannot reach Supabase. Aborting.")`
   This lets the underlying handler format structured key-value pairs when a JSON formatter is attached.

3. **Log level strategy**:
   - `logger.info` is used for lifecycle milestones (pipeline start/end, discovered counts, upsert counts, resolved commodity/market counts).
   - `logger.warning` is used for recoverable problems (external API failures, missing unique constraints causing fallback, non-critical logout failures, profile load failures).
   - `logger.error` is used for fatal or unrecoverable conditions (Supabase connectivity failure, inability to discover commodities, inability to resolve a commodity/market).
   - `logger.debug` is used for low-signal operational details (schema discovery columns, individual SELECT/INSERT failures during idempotent lookups).
   - `logger.exception` is used inside FastAPI routes around unexpected exceptions so the full traceback is captured while still returning a user-friendly HTTP response.

4. **Ingestion logging as a first-class concern**: The scraper pipeline writes structured run metadata into the `data_ingestion_logs` Supabase table via `log_ingestion_start` / `log_ingestion_end` in `Scraper/db.py`. Each run records `status` (`running` | `success` | `partial` | `failed`), `records_found`, `records_inserted`, `records_skipped`, `error_message`, `source`, and timestamps. This is the only place where "logs" are persisted as data rather than emitted to stderr.

5. **Error-to-HTTP mapping pattern**: Routes catch service-layer exceptions and translate them to `HTTPException`s with appropriate status codes; unknown exceptions fall through to `logger.exception` + 500. This keeps log messages focused on diagnostics while responses stay user-facing.

6. **No request/response middleware logging**: The FastAPI app has no access-log middleware (e.g. no per-request method/path/status logging). The only cross-cutting instrumentation is the `add_request_timing` middleware that adds an `X-Process-Time` header.

## Conventions and constraints

- **Every Python module that logs must create its own logger via `logging.getLogger(__name__)`** — this pattern is consistent across all 17+ modules that import `logging`.
- **Never use `print()` for operational logging** in either the backend or scraper; all runtime diagnostics go through the `logger` instance.
- **Use positional `%`-style arguments to `logger.*` methods** so downstream formatters can treat message fields as structured data.
- **Distinguish severity clearly**: `warning` for expected-but-unusual conditions (e.g. upstream API errors, missing DB constraints triggering fallback), `error` for failures that stop progress (connectivity loss, no data discovered), `debug` for high-volume tracing (individual DB query failures during idempotent lookups).
- **Pipeline runs are always recorded in the database**: `run_pipeline` guarantees that `log_ingestion_start` is called before work begins and `log_ingestion_end` is called with a final `status` regardless of success, partial success, or failure — even in dry-run mode the end-of-run log update is guarded but the overall flow enforces a complete record.
- **Frontend side has no application logger**: No custom logging abstraction or structured client-side logger was found in the Next.js frontend; any console output would be ad-hoc `console.log`/`console.error` calls without a central sink.