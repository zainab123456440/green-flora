---
kind: error_handling
name: Structured Error Handling Across FastAPI Backend and Next.js Frontend
category: error_handling
scope:
    - '**'
source_files:
    - Backend/services/auth_service.py
    - Backend/dependencies/auth.py
    - Backend/routes/auth.py
    - Backend/routes/assistant.py
    - Backend/main.py
    - Frontend/greenflora/services/AuthAPI.ts
    - Frontend/greenflora/services/FarmerAPI.tsx
    - Frontend/greenflora/Hooks/useFarmer.ts
    - Frontend/greenflora/Hooks/useAuth.tsx
    - Frontend/greenflora/components/ui/ErrorState.tsx
---

## Overview

The Green Flora platform uses a layered, typed error-handling strategy that separates domain errors from transport (HTTP) errors. The backend is a FastAPI application; the frontend is a Next.js app with per-service API clients. Errors flow from service layers up through routes to HTTP responses on the server side, and from fetch wrappers into React hooks/components on the client side.

## Backend: FastAPI

### Custom exception types in services

Service modules define small, domain-specific exception classes instead of raising bare `Exception`s:
- `AuthService` in `Backend/services/auth_service.py` defines `AuthError` (known auth failure) and `ServiceUnavailableError` (Supabase not configured/unreachable). All Supabase calls are wrapped in try/except blocks that log a warning and re-raise one of these two types with a user-friendly message (e.g. "Invalid credentials", "Session expired", "Could not create account").
- `AssistantError` is imported by `routes/assistant.py` for AI provider failures.

This keeps business logic errors distinct from infrastructure errors so route handlers can map them to appropriate HTTP status codes.

### Route-layer mapping to HTTP

Routes stay thin and delegate to services. Two patterns are used to convert service exceptions into HTTP responses:

1. **Per-route helper** — `routes/auth.py` defines `_exc_to_http(exc)` which maps `AuthError` → 400 Bad Request, `ServiceUnavailableError` → 503 Service Unavailable, and any other exception → 500 Internal Server Error with a generic message. Each public endpoint (`signup`, `login`, `refresh`) wraps its service call in `try/except Exception` and raises the mapped `HTTPException`.
2. **Inline mapping** — `routes/assistant.py` catches `AssistantError` as 400 and a broad `Exception` as 503 for `/transcribe` and `/speak`, logging via `logger.exception` before raising.

Authentication dependencies centralize 401 handling: `dependencies/auth.py::get_current_user` raises `HTTPException(status=401, detail="Authentication required.", headers={"WWW-Authenticate": "Bearer"})` when no token is present or when `AuthError` is raised by `auth_service.get_user_from_token`. A parallel `get_optional_user` returns `None` instead of raising, letting routes decide whether to treat missing auth as demo mode or return 401.

### Streaming and best-effort endpoints

- The assistant chat endpoint streams SSE events. Unexpected exceptions inside the stream generator are caught and emitted as an `{type: "error", retryable: true}` event so the stream ends cleanly rather than hanging.
- Logout and greeting endpoints are explicitly best-effort: logout ignores Supabase sign-out failures, and the greeting endpoint falls back to a hardcoded English greeting if farmer profile loading fails.

### Middleware

There is no global exception handler registered. FastAPI's default JSON error response format is used. A custom `@app.middleware("http")` adds an `X-Process-Time` header for debugging but does not alter error behavior. CORS middleware is configured for development origins.

## Frontend: Next.js

### Per-service API clients with typed errors

Each feature area has a dedicated API module under `Frontend/greenflora/services/` that encapsulates `fetch` calls and throws a typed error class:
- `AuthApiError` in `services/AuthAPI.ts` with fields `status: number` and `type: "network" | "timeout" | "validation" | "server" | "auth" | "unknown"`.
- `ApiError` in `services/FarmerAPI.tsx` with the same shape (plus `classifyError` mapping status codes).

The shared `request<T>()` helper in each file implements:
- 15-second timeout via `AbortController`.
- Automatic `Authorization: Bearer <token>` header injection using tokens stored in `localStorage`.
- Non-OK responses parsed for a `detail` field (matching FastAPI's default error body), then thrown as the typed error with a categorized type.
- Network errors and `AbortError` timeouts mapped to explicit `network` / `timeout` types.

### Hooks consume errors and surface user-friendly messages

React hooks wrap API calls in try/catch and set local `error` state with human-readable strings (e.g. `useFarmer.ts` sets `"Couldn't load your farm profile. Please try again."`). This pattern lets components render UI without duplicating error logic.

### Shared UI component

`components/ui/ErrorState.tsx` provides a reusable alert-style component with an optional retry button, used by pages to display hook-level errors consistently.

## Conventions and Constraints Observed

| Area | Convention | Evidence |
|---|---|---|
| Backend service layer | Define small custom exception subclasses (`AuthError`, `ServiceUnavailableError`, `AssistantError`) for all domain failures; never raise bare `Exception` to callers. | `services/auth_service.py`, `routes/assistant.py` |
| Backend route layer | Wrap service calls in `try/except Exception` and map to `HTTPException` with explicit status codes; log unexpected errors via `logger.exception`. | `routes/auth.py::_exc_to_http`, `routes/assistant.py` |
| Authentication | Use `get_current_user` for strict 401 enforcement; use `get_optional_user` for routes that support demo/live modes. Missing/invalid tokens always include `WWW-Authenticate: Bearer`. | `dependencies/auth.py` |
| Backend streaming | Catch all exceptions inside SSE generators and emit a `{type: "error", retryable: true}` event so streams terminate gracefully. | `routes/assistant.py::chat` |
| Backend best-effort | Non-critical operations (logout, greeting fallback) catch and ignore exceptions rather than failing the whole request. | `routes/auth.py::logout`, `routes/assistant.py::greeting` |
| Frontend API clients | Centralize `fetch` in a `request<T>()` helper per service; throw typed `*ApiError` with `status` and `type`; add 15s timeout. | `services/AuthAPI.ts`, `services/FarmerAPI.tsx` |
| Frontend hooks | Catch API errors and set user-facing `error` strings; expose `isLoading`/`isSaving` booleans alongside data. | `Hooks/useFarmer.ts`, `Hooks/useAuth.tsx`, `Hooks/useAssistant.ts` |
| Frontend UI | Render errors via the shared `ErrorState` component with optional retry action. | `components/ui/ErrorState.tsx` |

## What Is Not Present

- No global FastAPI exception handler (`@app.exception_handler`) is registered; default FastAPI error responses are used.
- No centralized frontend toast/notification library is used; errors are surfaced via React state and the `ErrorState` component.
- No `panic`/`recover` equivalent exists (Python/JS conventions apply).
- No structured logging framework beyond Python's `logging` module.