"""
services/assistant_tools.py

Green Flora's internal data tools for the AI Assistant.

The assistant's reasoning model (OpenAI GPT-5.6 Luna primary, Gemini
secondary) decides *when* to use these tools; this module decides *how*
the data is fetched. Everything here reuses the existing services and
data sources so the AI never sees a parallel, duplicated dataset:

  - Weather  -> Open-Meteo (same source as the frontend weather page)
  - Market   -> market_service (AMIS-ingested Supabase tables)
  - Products -> agricultural_products Supabase table (same table the
                Crop Doctor uses for recommendations)

Data-integrity rules (project rules #10 / #17):
  - Never fabricate weather, prices, or products.
  - When data is missing the tool returns an explicit "unavailable"
    payload so the model can tell the farmer honestly instead of
    inventing numbers.
"""

import logging
from typing import Any, Optional

import httpx

from config.supabase_client import supabase
from services.market_service import market_service

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Tunables
# ---------------------------------------------------------------------------

_OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
_OPEN_METEO_GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"
_HTTP_TIMEOUT_SECONDS = 10.0
_MAX_MARKET_COMPARISON = 8          # markets listed back to the model
_MAX_PRODUCTS = 6                   # product rows per search
_MAX_AVAILABLE_CROPS = 25           # hint list when a crop is not found

# ---------------------------------------------------------------------------
# Urdu / Roman-Urdu crop aliases -> English names used by AMIS commodities.
# Pakistani farmers commonly refer to crops by these names, so the market
# tool resolves them before looking prices up.
# ---------------------------------------------------------------------------

_CROP_ALIASES: dict[str, str] = {
    # Wheat
    "gehu": "wheat", "gandam": "wheat", "gandum": "wheat", "kanak": "wheat",
    "گندم": "wheat",
    # Rice
    "chawal": "rice", "chawal sabat": "rice", "dhan": "rice", "sella": "rice",
    "چاول": "rice", "دھان": "rice",
    # Maize / Corn
    "makai": "maize", "makka": "maize", "corn": "maize", "جوار": "jowar",
    "باجرہ": "bajra", "bajra": "bajra", "bajri": "bajra", "jowar": "jowar",
    # Potato
    "aalu": "potato", "alu": "potato", "potato": "potato", "آلو": "potato",
    # Onion
    "piyaz": "onion", "pyaz": "onion", "پياز": "onion",
    # Tomato
    "tamatar": "tomato", "ٹماٹر": "tomato",
    # Sugarcane
    "ganna": "sugarcane", "گانا": "sugarcane", "کمہ": "sugarcane",
    # Cotton
    "kapas": "cotton", "kapaas": "cotton", "ruyi": "cotton",
    "rui": "cotton", "کپاس": "cotton",
    # Gram / pulses
    "chana": "gram", "chhole": "gram", "چنہ": "gram",
    "masoor": "lentil", "masur": "lentil",
    "moong": "mung", "mong": "mung", "مونگ": "mung",
    "mash": "mash", "urad": "mash",
    # Mustard
    "sarson": "mustard", "sarson ka saag": "mustard", "سرسوں": "mustard",
    # Garlic / ginger
    "lehsan": "garlic", "lasan": "garlic",
    "adrak": "ginger", "अदरक": "ginger",
    # Others
    "baingan": "brinjal", "bengan": "brinjal",
    "gajar": "carrot", "band gobi": "cabbage", "phool gobi": "cauliflower",
    "shimla mirch": "capsicum", "mirch": "chilli", "lalmirch": "chilli",
    "kela": "banana", "angoor": "grapes", "amrood": "guava",
    "kinno": "kinnow", "santra": "orange", "khajoor": "dates",
    "badam": "almond", "akrot": "walnut",
}

# WMO weather interpretation codes used by Open-Meteo.
_WMO_CODES: dict[int, str] = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing rime fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    56: "Light freezing drizzle", 57: "Dense freezing drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    66: "Light freezing rain", 67: "Heavy freezing rain",
    71: "Slight snowfall", 73: "Moderate snowfall", 75: "Heavy snowfall",
    77: "Snow grains",
    80: "Slight rain showers", 81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers", 86: "Heavy snow showers",
    95: "Thunderstorm", 96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def _wmo(code: Optional[int]) -> str:
    return _WMO_CODES.get(code, "Unknown conditions") if code is not None else "Unknown conditions"


# ---------------------------------------------------------------------------
# Farmer snapshot (loaded once per request, shared by prompt + tools)
# ---------------------------------------------------------------------------

def load_farmer_snapshot(user_id: Optional[str]) -> dict:
    """
    Load the farmer profile and fields through the existing services.

    Returns ``{"farmer": Farmer|None, "fields": list}``.  Each part
    degrades independently — a missing profile never blocks the chat.
    """
    snapshot: dict = {"farmer": None, "fields": []}

    try:
        from services.farmer_service import farmer_service
        snapshot["farmer"] = farmer_service.get_farmer(user_id)
    except Exception as exc:
        logger.warning("Assistant could not load farmer profile: %s", exc)

    try:
        from services.field_service import field_service
        snapshot["fields"] = field_service.list_fields(user_id)
    except Exception as exc:
        logger.warning("Assistant could not load fields: %s", exc)

    return snapshot


def render_farmer_context(snapshot: dict) -> str:
    """
    Render a compact, human-readable summary of the farmer's profile and
    fields for the system prompt.
    """
    lines: list[str] = []
    farmer = snapshot.get("farmer")

    if farmer:
        lines.append(f"- Name: {farmer.name}")
        if farmer.location:
            lines.append(f"- Location: {farmer.location}")
        if farmer.farm_latitude is not None and farmer.farm_longitude is not None:
            lines.append(
                f"- Farm coordinates: {farmer.farm_latitude:.4f}, "
                f"{farmer.farm_longitude:.4f}"
            )
        if farmer.farm_name:
            lines.append(f"- Farm name: {farmer.farm_name}")
        if farmer.farm_area_acres:
            lines.append(f"- Farm area: {farmer.farm_area_acres} acres")
        if farmer.soil_type:
            lines.append(f"- Soil type: {farmer.soil_type}")
        if farmer.irrigation_method:
            lines.append(f"- Irrigation: {farmer.irrigation_method}")
        if farmer.budget_pkr is not None:
            lines.append(f"- Budget: PKR {farmer.budget_pkr:,.0f}")
        if farmer.current_crop:
            crop_line = f"- Current crop: {farmer.current_crop}"
            if farmer.crop_stage:
                crop_line += f" (stage: {farmer.crop_stage})"
            lines.append(crop_line)

    # Fields + active crop cycles (more specific than the profile crop).
    for f in (snapshot.get("fields") or [])[:6]:
        if f.get("status") == "active" and f.get("active_crop_cycle"):
            cycle = f["active_crop_cycle"]
            area = f.get("area_acres")
            area_txt = f" ({area:g} acres)" if area else ""
            stage = f", stage: {cycle['crop_stage']}" if cycle.get("crop_stage") else ""
            lines.append(
                f"- Field '{f.get('name')}'{area_txt}: "
                f"{cycle.get('crop_name')}{stage}"
            )

    if not lines:
        return "No farmer profile data is available yet."
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Tool: weather
# ---------------------------------------------------------------------------

def _geocode_place(place: str) -> Optional[dict]:
    """Resolve a place name to coordinates via Open-Meteo geocoding."""
    try:
        resp = httpx.get(
            _OPEN_METEO_GEOCODE_URL,
            params={"name": place, "count": 1, "language": "en"},
            timeout=_HTTP_TIMEOUT_SECONDS,
        )
        resp.raise_for_status()
        results = resp.json().get("results") or []
        if not results:
            return None
        first = results[0]
        return {
            "latitude": first["latitude"],
            "longitude": first["longitude"],
            "resolved_name": ", ".join(
                p for p in [first.get("name"), first.get("admin1"), first.get("country")]
                if p
            ),
        }
    except Exception as exc:
        logger.warning("Geocoding failed for '%s': %s", place, exc)
        return None


def get_weather(place: Optional[str], farm_latitude: Optional[float],
                farm_longitude: Optional[float]) -> dict:
    """
    Current conditions + 7-day forecast.  Uses the farmer's saved farm
    coordinates by default; a ``place`` name (e.g. "Lahore") is geocoded
    for questions about other locations.
    """
    location_label = "the farmer's saved farm location"
    latitude, longitude = farm_latitude, farm_longitude

    if place:
        geo = _geocode_place(place)
        if geo is None:
            return {
                "available": False,
                "reason": "place_not_found",
                "message": (
                    f"Could not locate the place '{place}'. Ask the farmer "
                    "to check the spelling or use a nearby city name."
                ),
            }
        latitude = geo["latitude"]
        longitude = geo["longitude"]
        location_label = geo["resolved_name"]
    elif latitude is None or longitude is None:
        return {
            "available": False,
            "reason": "no_saved_location",
            "message": (
                "The farmer has not saved a farm location in their Green "
                "Flora profile, so local weather cannot be fetched. Ask "
                "them to set their farm location in the profile page."
            ),
        }

    try:
        resp = httpx.get(
            _OPEN_METEO_FORECAST_URL,
            params={
                "latitude": latitude,
                "longitude": longitude,
                "timezone": "auto",
                "current": ",".join([
                    "temperature_2m", "apparent_temperature",
                    "relative_humidity_2m", "precipitation", "weather_code",
                    "wind_speed_10m",
                ]),
                "daily": ",".join([
                    "weather_code", "temperature_2m_max", "temperature_2m_min",
                    "precipitation_sum", "precipitation_probability_max",
                    "wind_speed_10m_max",
                ]),
                "forecast_days": 7,
            },
            timeout=_HTTP_TIMEOUT_SECONDS,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        logger.warning("Weather fetch failed: %s", exc)
        return {
            "available": False,
            "reason": "service_unavailable",
            "message": "Weather data could not be retrieved right now.",
        }

    current = data.get("current", {})
    daily = data.get("daily", {})

    forecast = []
    times = daily.get("time", [])
    for i, day in enumerate(times):
        forecast.append({
            "date": day,
            "conditions": _wmo(daily.get("weather_code", [None] * len(times))[i]),
            "temp_max_c": daily.get("temperature_2m_max", [None] * len(times))[i],
            "temp_min_c": daily.get("temperature_2m_min", [None] * len(times))[i],
            "precipitation_mm": daily.get("precipitation_sum", [None] * len(times))[i],
            "rain_probability_pct":
                daily.get("precipitation_probability_max", [None] * len(times))[i],
            "wind_max_kmh": daily.get("wind_speed_10m_max", [None] * len(times))[i],
        })

    return {
        "available": True,
        "location": location_label,
        "current": {
            "temperature_c": current.get("temperature_2m"),
            "feels_like_c": current.get("apparent_temperature"),
            "humidity_pct": current.get("relative_humidity_2m"),
            "precipitation_mm": current.get("precipitation"),
            "conditions": _wmo(current.get("weather_code")),
            "wind_kmh": current.get("wind_speed_10m"),
        },
        "forecast_7_days": forecast,
        "note": (
            "Data from Open-Meteo for the requested location. Derived from "
            "real forecasts — do not invent values beyond this."
        ),
    }


# ---------------------------------------------------------------------------
# Tool: crop market data
# ---------------------------------------------------------------------------

def _normalize_crop(crop: str) -> str:
    """Map Urdu / Roman-Urdu crop names to English (case-insensitive)."""
    key = crop.strip().lower()
    return _CROP_ALIASES.get(key, key)


def _match_commodity(crop: str) -> Optional[dict]:
    """
    Resolve a crop name against the AMIS commodities list.

    Tries exact (normalized) match first, then substring containment in
    either direction so 'wheat seed' or 'potato (red)' still resolve.
    """
    items, _available = market_service.list_commodities()
    if not items:
        return None

    target = _normalize_crop(crop)
    exact = next(
        (c for c in items if c["name"].strip().lower() == target), None
    )
    if exact:
        return exact

    partial = next(
        (
            c for c in items
            if target in c["name"].strip().lower()
            or c["name"].strip().lower() in target
        ),
        None,
    )
    return partial


def get_crop_market_data(crop: str) -> dict:
    """
    Latest AMIS price bundle for a crop: current price, unit, change,
    signal, highest/lowest market, and the per-market comparison.
    """
    try:
        commodity = _match_commodity(crop)
        if commodity is None:
            items, _available = market_service.list_commodities()
            available = [c["name"] for c in items[:_MAX_AVAILABLE_CROPS]]
            return {
                "found": False,
                "message": (
                    f"Green Flora has no AMIS price data for '{crop}'. "
                    "Suggest one of the available crops or offer web search."
                ),
                "available_crops": available,
            }

        overview = market_service.get_overview(
            commodity["id"], days=30
        )

        trend = overview.get("trend") or []
        trend_summary = None
        if len(trend) >= 2:
            prices = [p["price"] for p in trend]
            trend_summary = {
                "window_days": overview.get("days_of_data"),
                "first_date": trend[0]["date"],
                "last_date": trend[-1]["date"],
                "min_price": min(prices),
                "max_price": max(prices),
            }

        return {
            "found": True,
            "crop": overview["commodity_name"],
            "unit": overview.get("unit"),
            "latest_date": overview.get("latest_date"),
            "current_price": overview.get("current_price"),
            "price_basis": overview.get("price_basis"),
            "markets_reporting": overview.get("markets_reporting"),
            "change_pct": overview.get("change_pct"),
            "change_period_days": overview.get("change_period_days"),
            "signal": overview.get("signal"),
            "highest_market": overview.get("highest_market"),
            "lowest_market": overview.get("lowest_market"),
            "market_comparison": (
                overview.get("market_comparison") or []
            )[:_MAX_MARKET_COMPARISON],
            "trend_30_day_summary": trend_summary,
            "insights": overview.get("insights") or [],
            "note": (
                "Official AMIS (Punjab Agriculture Marketing) data from "
                "Green Flora's database. Report prices exactly as given "
                "with their unit and date — never invent or adjust them."
            ),
        }
    except LookupError:
        return {"found": False, "message": f"No AMIS data found for '{crop}'."}
    except Exception as exc:
        logger.warning("Market tool failed for '%s': %s", crop, exc)
        return {
            "found": False,
            "reason": "service_unavailable",
            "message": "Market prices could not be retrieved right now.",
        }


# ---------------------------------------------------------------------------
# Tool: agricultural product search
# ---------------------------------------------------------------------------

def search_agricultural_products(query: str) -> dict:
    """
    Search Green Flora's ``agricultural_products`` dataset (the same table
    the Crop Doctor uses) by problem / crop / category keywords.
    """
    if supabase is None:
        return {
            "available": False,
            "message": "Product data is not configured in Green Flora.",
        }

    # Keep the PostgREST `or=` grammar safe: strip characters that are
    # structural (commas, parens) or SQL LIKE wildcards from each term.
    cleaned_terms: list[str] = []
    for raw_term in query.lower().split():
        term = "".join(ch for ch in raw_term if ch not in "%_,()*\"'")
        if len(term) > 2:
            cleaned_terms.append(term)
    terms = cleaned_terms
    if not terms:
        return {"available": True, "results": []}

    # OR-group per term over the text columns, combined with commas.
    or_clauses = ",".join(
        f"local_problem_target.ilike.%{term}%,"
        f"scientific_target_action.ilike.%{term}%,"
        f"category.ilike.%{term}%,"
        f"best_local_brand.ilike.%{term}%"
        for term in terms[:4]
    )

    try:
        result = (
            supabase.table("agricultural_products")
            .select(
                "category, local_problem_target, scientific_target_action, "
                "best_local_brand, company, formulation_active_ingredient, "
                "dosage_per_acre, approx_price_pkr, min_price_pkr, max_price_pkr"
            )
            .or_(or_clauses)
            .limit(_MAX_PRODUCTS)
            .execute()
        )
        rows = result.data or []
    except Exception as exc:
        logger.warning("Product search failed for '%s': %s", query, exc)
        return {
            "available": False,
            "message": "Product data could not be retrieved right now.",
        }

    products = []
    for row in rows:
        products.append({
            "category": row.get("category"),
            "target_problem": row.get("local_problem_target"),
            "action": row.get("scientific_target_action"),
            "brand": row.get("best_local_brand"),
            "company": row.get("company"),
            "active_ingredient": row.get("formulation_active_ingredient"),
            "dosage_per_acre": row.get("dosage_per_acre"),
            "approx_price_pkr": row.get("approx_price_pkr"),
            "price_range_pkr": [row.get("min_price_pkr"), row.get("max_price_pkr")],
        })

    return {
        "available": True,
        "results": products,
        "message": (
            "Factual records from Green Flora's agricultural product "
            "dataset. Present them exactly as stored — never invent "
            "brands, dosages, or prices."
        ) if products else "No matching products in the dataset.",
    }


# ---------------------------------------------------------------------------
# Canonical tool definitions shared by both providers
# ---------------------------------------------------------------------------

# Each entry: provider-neutral description. The assistant service converts
# these into OpenAI Responses-API tools and Gemini function declarations.

TOOL_DEFINITIONS: list[dict[str, Any]] = [
    {
        "name": "get_weather",
        "description": (
            "Get current weather and a 7-day forecast for the farmer's "
            "saved farm location. Only pass 'place' when the farmer asks "
            "about a DIFFERENT location (e.g. another city)."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "place": {
                    "type": "string",
                    "description": "Optional city/place name, e.g. 'Lahore'.",
                },
            },
            "required": [],
        },
    },
    {
        "name": "get_crop_market_data",
        "description": (
            "Get the latest official AMIS mandi price for a crop in "
            "Pakistan: current price with unit, recent change, rising/"
            "falling signal, and per-market comparison. Understands Urdu "
            "and Roman-Urdu crop names (e.g. 'gehu', 'tamatar')."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "crop": {
                    "type": "string",
                    "description": "Crop name (English, Urdu, or Roman Urdu).",
                },
            },
            "required": ["crop"],
        },
    },
    {
        "name": "search_agricultural_products",
        "description": (
            "Search Green Flora's agricultural product dataset "
            "(pesticides, fertilizers, weedicides, tonics) by problem, "
            "crop, pest or disease — e.g. 'aphid', 'wheat rust', "
            "'leaf blight tomato'. Returns real brands, dosages, prices."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Problem, pest, disease, or crop keywords.",
                },
            },
            "required": ["query"],
        },
    },
]
