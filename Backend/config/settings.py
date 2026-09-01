"""
settings.py

Centralized environment configuration.

Every other backend module reads configuration through this file rather
than calling os.environ directly. This keeps secrets out of the code
(project-context.md, Section 28, rules 9-10: "Never hardcode API keys.
Use environment variables for secrets.") and gives one place to see
every setting the app depends on.

Expects a `.env` file in `Backend/` (never committed - see README) with
entries like:

    DEMO_MODE=true
    DATABASE_URL=
    OPENWEATHER_API_KEY=
    ALIBABA_MODEL_STUDIO_KEY=
    ALIBABA_OSS_KEY=
    ALIBABA_OSS_SECRET=
    GEMINI_API_KEY=
"""

import os
from dotenv import load_dotenv

# Load variables from Backend/.env into the process environment.
# Safe to call even if the file doesn't exist yet (e.g. fresh clone).
load_dotenv()


def _get_bool(env_var: str, default: bool = False) -> bool:
    """Parse an env var like 'true'/'1'/'yes' into a real bool."""
    value = os.getenv(env_var)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _get_list(env_var: str, default: list[str] | None = None) -> list[str]:
    """Parse a comma-separated env var into a list of strings."""
    value = os.getenv(env_var)
    if value is None:
        return default or []
    return [item.strip() for item in value.split(",") if item.strip()]


class Settings:
    """
    Read-only snapshot of the app's configuration.

    Instantiated once below as `settings` and imported everywhere else.
    """

    def __init__(self) -> None:
        # Core mode switch: when True (or when no database is
        # configured), services fall back to seeded demo data instead
        # of hitting a real database or external API.
        self.demo_mode: bool = _get_bool("DEMO_MODE", default=True)

        # Database
        self.database_url: str = os.getenv("DATABASE_URL", "")

        # CORS — configurable via env, defaults to common dev origins
        self.cors_origins: list[str] = _get_list(
            "CORS_ORIGINS",
            default=["http://localhost:3000"],
        )

        # Supabase
        self.supabase_url: str = os.getenv("SUPABASE_URL", "")
        self.supabase_service_key: str = os.getenv("SUPABASE_SERVICE_KEY", "")
        self.supabase_anon_key: str = os.getenv("SUPABASE_ANON_KEY", "")

        # External API keys (all optional at this stage of the MVP -
        # features that need them should degrade gracefully if empty)
        self.openweather_api_key: str = os.getenv("OPENWEATHER_API_KEY", "")
        self.alibaba_model_studio_key: str = os.getenv(
            "ALIBABA_MODEL_STUDIO_KEY", ""
        )
        self.alibaba_oss_key: str = os.getenv("ALIBABA_OSS_KEY", "")
        self.alibaba_oss_secret: str = os.getenv("ALIBABA_OSS_SECRET", "")

        # Gemini (Crop Doctor image analysis)
        self.gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")

        # General app info
        self.app_name: str = "Green Flora API"
        self.environment: str = os.getenv("ENVIRONMENT", "development")


# Single shared settings instance used across the backend.
settings = Settings()
