"""
config.py

Centralized configuration for the AMIS scraper pipeline.

All secrets come from environment variables (or a .env file placed
alongside this module).  Nothing is hard-coded.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from the Scraper/ directory if present.
load_dotenv(Path(__file__).resolve().parent / ".env")

# ---------------------------------------------------------------------------
# Supabase credentials (from env / GitHub Actions Secrets)
# ---------------------------------------------------------------------------

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")

# ---------------------------------------------------------------------------
# AMIS website constants
# ---------------------------------------------------------------------------

AMIS_BASE_URL: str = "http://www.amis.pk"
AMIS_PRICES_URL: str = f"{AMIS_BASE_URL}/ViewPrices.aspx"
AMIS_BROWSE_URL: str = f"{AMIS_BASE_URL}/BrowsePrices.aspx"
AMIS_SEARCH_TYPE: str = "0"  # 0 = commodity across all markets

# ---------------------------------------------------------------------------
# HTTP behaviour
# ---------------------------------------------------------------------------

REQUEST_TIMEOUT: int = 30          # seconds per request
REQUEST_DELAY: float = 1.0         # polite delay between requests (seconds)
MAX_RETRIES: int = 3               # retries per request
RETRY_BACKOFF: float = 2.0         # exponential backoff multiplier

# Browser-like User-Agent so AMIS doesn't reject the request.
USER_AGENT: str = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/126.0.0.0 Safari/537.36"
)

# ---------------------------------------------------------------------------
# Supabase upsert behaviour
# ---------------------------------------------------------------------------

BATCH_SIZE: int = 100              # rows per Supabase upsert batch

# ---------------------------------------------------------------------------
# Table names (must match existing Supabase schema)
# ---------------------------------------------------------------------------

TABLE_COMMODITIES: str = "commodities"
TABLE_MARKETS: str = "markets"
TABLE_RATES: str = "crop_market_rates"
TABLE_LOGS: str = "data_ingestion_logs"

# ---------------------------------------------------------------------------
# Ingestion source identifier
# ---------------------------------------------------------------------------

INGESTION_SOURCE: str = "AMIS"
