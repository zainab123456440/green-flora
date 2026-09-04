"""
Centralized Supabase client for Green Flora.

Uses a dedicated HTTPX client configured for stable HTTP/1.1 connections.
This avoids intermittent HTTP/2 socket errors on Windows.
"""

from typing import Optional

import httpx
from supabase import Client, ClientOptions, create_client

from config.settings import settings


supabase: Optional[Client] = None


if settings.supabase_url and settings.supabase_service_key:

    http_client = httpx.Client(
        http2=False,
        timeout=httpx.Timeout(
            connect=10.0,
            read=30.0,
            write=30.0,
            pool=10.0,
        ),
        limits=httpx.Limits(
            max_connections=20,
            max_keepalive_connections=10,
            keepalive_expiry=30.0,
        ),
    )

    options = ClientOptions(
        httpx_client=http_client,
        postgrest_client_timeout=30,
        storage_client_timeout=30,
        function_client_timeout=30,
    )

    supabase = create_client(
        settings.supabase_url,
        settings.supabase_service_key,
        options=options,
    )