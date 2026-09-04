---
kind: external_dependency
name: Supabase (PostgreSQL + Auth + Storage)
slug: supabase
category: external_dependency
category_hints:
    - vendor_identity
    - auth_protocol
scope:
    - '**'
---

Managed PostgreSQL database and auth provider for Green Flora. The backend initializes a single Supabase client via `create_client` in `Backend/config/supabase_client.py`, using a dedicated HTTPX client with HTTP/1.1 forced (to avoid Windows HTTP/2 socket errors) and PostgREST/storage/function timeouts set to 30s. Credentials are read from `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and `SUPABASE_ANON_KEY` in `Backend/.env` and mirrored into the frontend `.env`. The project uses Row Level Security on tables such as `fields` and `crop_cycles`; when inserting or querying, always ensure the authenticated user's context is present so RLS policies can apply. Verify exact table schemas against the live Supabase project before adding columns — the Phase 4 field-creation bug was caused by code referencing `area_acres` while the DB column was `area`, and missing `soil_type`/`irrigation_method`/`crop_name`/`crop_stage` columns.