"""
supabase_client.py

Centralized Supabase client used by every backend module that needs
to talk to the database or the built-in Supabase Auth service.

The client is instantiated once with the service-role key (never the
anon key) so the backend can perform privileged operations such as
reading user metadata or managing sessions.

If SUPABASE_URL or SUPABASE_SERVICE_KEY are empty (e.g. fresh clone,
local demo mode), the module still imports cleanly but `supabase` will
be ``None``.  Callers should check for this and fall back to demo data.
"""

from typing import Optional

from supabase import Client, create_client

from config.settings import settings

supabase: Optional[Client] = None

if settings.supabase_url and settings.supabase_service_key:
    supabase = create_client(settings.supabase_url, settings.supabase_service_key)
