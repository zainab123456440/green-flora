"""
parser.py

Fetches and parses AMIS (amis.pk) HTML pages to extract daily
commodity/market price data.

AMIS is an ASP.NET WebForms site.  The HTML structure was verified
live; the key selectors are:

  Commodity name : <span id="ctl00_cphPage_lblMsg">
  Date           : first <td> in the header row containing "Dated:DD-MM-YYYY"
  Data table     : <table> found by id "ctl00_cphPage_Grd" OR by locating
                   the header row with Min/Max/FQP/Quantity columns
  Market row     : <td> #1 has row-number + <a>market</a>, <td> #2 Graph,
                   <td> #3 Min, <td> #4 Max, <td> #5 FQP, <td> #6 Quantity
"""

import logging
import re
import time
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Optional

import requests
from bs4 import BeautifulSoup, Tag

from Scraper import config

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------


@dataclass
class CommodityInfo:
    """A commodity discovered from the AMIS browse page."""
    commodity_id: int
    name: str


@dataclass
class MarketPrice:
    """One row of price data for a commodity in a specific market."""
    commodity_name: str
    market_name: str
    date: date
    min_price: Optional[float]
    max_price: Optional[float]
    fqp_price: Optional[float]
    quantity: Optional[float]
    unit: str = "Rs/100Kg"
    amis_market_id: Optional[int] = None


@dataclass
class ParsedResult:
    """All data parsed from a single commodity page."""
    commodity_name: str
    date: date
    unit: str
    prices: list[MarketPrice] = field(default_factory=list)


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------


def _build_session() -> requests.Session:
    """Create a requests session with a browser-like User-Agent."""
    session = requests.Session()
    session.headers.update({"User-Agent": config.USER_AGENT})
    return session


def _fetch_with_retry(
    session: requests.Session,
    url: str,
    params: dict | None = None,
) -> Optional[str]:
    """
    GET *url* with retries and exponential back-off.

    Returns the response text on success, ``None`` on total failure.
    """
    delay = config.REQUEST_DELAY
    for attempt in range(1, config.MAX_RETRIES + 1):
        try:
            resp = session.get(
                url,
                params=params,
                timeout=config.REQUEST_TIMEOUT,
            )
            resp.raise_for_status()
            # AMIS uses ISO-8859 / Windows-1252 in some pages; force UTF-8
            # only when the server hasn't specified an encoding.
            if not resp.encoding or resp.encoding == "ISO-8859-1":
                resp.encoding = resp.apparent_encoding or "utf-8"
            return resp.text
        except requests.RequestException as exc:
            logger.warning(
                "Attempt %d/%d failed for %s: %s",
                attempt, config.MAX_RETRIES, url, exc,
            )
            if attempt < config.MAX_RETRIES:
                time.sleep(delay)
                delay *= config.RETRY_BACKOFF
    logger.error("All %d attempts failed for %s", config.MAX_RETRIES, url)
    return None


# ---------------------------------------------------------------------------
# Commodity discovery
# ---------------------------------------------------------------------------


def discover_commodities(session: requests.Session) -> list[CommodityInfo]:
    """
    Fetch the BrowsePrices page and extract all commodity links.

    Each link looks like:
        <a href="ViewPrices.aspx?searchType=0&commodityId=41">Apple (Ammre)</a>

    Returns a deduplicated list of CommodityInfo objects.
    """
    html = _fetch_with_retry(session, config.AMIS_BROWSE_URL,
                             params={"searchType": config.AMIS_SEARCH_TYPE})
    if html is None:
        logger.error("Could not fetch BrowsePrices page.")
        return []

    soup = BeautifulSoup(html, "html.parser")
    seen: set[int] = set()
    commodities: list[CommodityInfo] = []

    # Find all <a> tags whose href contains commodityId
    pattern = re.compile(r"commodityId=(\d+)")
    for link in soup.find_all("a", href=True):
        match = pattern.search(link["href"])
        if not match:
            continue
        cid = int(match.group(1))
        if cid in seen:
            continue
        name = link.get_text(strip=True)
        if not name:
            continue
        seen.add(cid)
        commodities.append(CommodityInfo(commodity_id=cid, name=name))

    commodities.sort(key=lambda c: c.commodity_id)
    logger.info("Discovered %d commodities from AMIS browse page.",
                len(commodities))
    return commodities


# ---------------------------------------------------------------------------
# Single-commodity page parser
# ---------------------------------------------------------------------------


def fetch_and_parse(
    session: requests.Session,
    commodity_id: int,
) -> Optional[ParsedResult]:
    """
    Fetch ViewPrices.aspx for *commodity_id* and parse the price table.

    Returns ``None`` if the page could not be fetched or parsed.
    """
    html = _fetch_with_retry(
        session,
        config.AMIS_PRICES_URL,
        params={
            "searchType": config.AMIS_SEARCH_TYPE,
            "commodityId": commodity_id,
        },
    )
    if html is None:
        return None

    try:
        return _parse_html(html)
    except Exception:
        logger.exception(
            "Unexpected error parsing commodity %d page.", commodity_id,
        )
        return None


def _parse_html(html: str) -> Optional[ParsedResult]:
    """
    Extract commodity name, date, unit and market price rows from the
    raw HTML of a ViewPrices.aspx page.
    """
    soup = BeautifulSoup(html, "html.parser")

    # -- Commodity name -------------------------------------------------------
    commodity_name = _extract_commodity_name(soup)
    if not commodity_name:
        logger.debug("Could not find commodity name in page.")
        return None

    # -- Date ------------------------------------------------------------------
    page_date, unit = _extract_date_and_unit(soup, commodity_name)
    if page_date is None:
        logger.debug("Could not find date for commodity '%s'.", commodity_name)
        return None

    # -- Price table -----------------------------------------------------------
    table = _find_data_table(soup)
    if table is None:
        logger.debug("Could not locate data table for '%s'.", commodity_name)
        return None

    prices = _parse_table_rows(table, commodity_name, page_date, unit)
    return ParsedResult(
        commodity_name=commodity_name,
        date=page_date,
        unit=unit,
        prices=prices,
    )


# ---------------------------------------------------------------------------
# Internal parsing helpers
# ---------------------------------------------------------------------------


def _extract_commodity_name(soup: BeautifulSoup) -> Optional[str]:
    """
    Try several strategies to find the commodity name.

    Primary:   <span id="ctl00_cphPage_lblMsg">Wheat</span>
    Fallback:  <h2> text matching "Commodity:  <name> [..."
    """
    # Strategy 1: known span ID
    span = soup.find("span", id="ctl00_cphPage_lblMsg")
    if span:
        name = span.get_text(strip=True)
        if name:
            return name

    # Strategy 2: regex on <h2> text
    for h2 in soup.find_all("h2"):
        text = h2.get_text()
        m = re.search(r"Commodity:\s*(.+?)(?:\s*\[|$)", text)
        if m:
            return m.group(1).strip()

    # Strategy 3: any bold text containing "Commodity:"
    for tag in soup.find_all(["b", "strong"]):
        text = tag.get_text()
        m = re.search(r"Commodity:\s*(.+?)(?:\s*\[|$)", text)
        if m:
            return m.group(1).strip()

    return None


def _extract_date_and_unit(
    soup: BeautifulSoup,
    commodity_name: str,
) -> tuple[Optional[date], str]:
    """
    Find the date (DD-MM-YYYY) and unit string from the page.

    The date lives in the first <td> of the data-table header row:
        "Dated:01-09-2026"

    The unit is extracted from the commodity heading:
        "[ All Prices are in Rs/100Kg specified otherwise ]"
    """
    date_value: Optional[date] = None
    unit = "Rs/100Kg"  # default

    # Try to find unit from the heading
    span = soup.find("span", id="ctl00_cphPage_lblquintal")
    if span:
        unit_text = span.get_text(strip=True)
        m = re.search(r"Rs/(\d+\s*Kg)", unit_text, re.IGNORECASE)
        if m:
            unit = f"Rs/{m.group(1)}"

    # Date: search all text nodes for "Dated:DD-MM-YYYY"
    date_pattern = re.compile(r"Dated:(\d{2}-\d{2}-\d{4})")
    for td in soup.find_all("td"):
        text = td.get_text()
        m = date_pattern.search(text)
        if m:
            try:
                date_value = datetime.strptime(m.group(1), "%d-%m-%Y").date()
            except ValueError:
                pass
            break

    return date_value, unit


def _find_data_table(soup: BeautifulSoup) -> Optional[Tag]:
    """
    Locate the main price data <table>.

    Strategy 1: table with id containing "Grd"
    Strategy 2: any <table> whose first <tr> has cells "Min", "Max", "FQP"
    """
    # Strategy 1: known ID pattern
    table = soup.find("table", id=re.compile(r"Grd", re.IGNORECASE))
    if table:
        return table

    # Also check if ctl00_cphPage_Grd is on a parent <td>
    td = soup.find("td", id="ctl00_cphPage_Grd")
    if td:
        table = td.find("table")
        if table:
            return table

    # Strategy 2: search all tables for the header row
    for tbl in soup.find_all("table"):
        first_row = tbl.find("tr")
        if first_row is None:
            continue
        cells = [c.get_text(strip=True).lower() for c in first_row.find_all("td")]
        if "min" in cells and "max" in cells and "fqp" in cells:
            return tbl

    return None


def _parse_table_rows(
    table: Tag,
    commodity_name: str,
    page_date: date,
    unit: str,
) -> list[MarketPrice]:
    """
    Iterate through the data table rows (skipping the header) and
    extract MarketPrice records.
    """
    rows = table.find_all("tr")
    prices: list[MarketPrice] = []

    # Skip the header row (contains "Dated:", "Graph", "Min", "Max", "FQP", "Quantity")
    header_skipped = False
    for row in rows:
        cells = row.find_all("td")
        if not cells:
            continue

        cell_texts = [c.get_text(strip=True) for c in cells]

        # Detect and skip the header row
        if not header_skipped:
            lower_texts = [t.lower() for t in cell_texts]
            if "min" in lower_texts or "max" in lower_texts or "fqp" in lower_texts:
                header_skipped = True
                continue
            # If the first cell contains "Dated:" it's the header
            if any("dated:" in t.lower() for t in cell_texts):
                header_skipped = True
                continue

        if not header_skipped:
            continue

        # Expect 5-6 columns: market, graph, min, max, fqp, [quantity]
        if len(cell_texts) < 5:
            continue

        market_name = _extract_market_name(cells[0])
        if not market_name:
            continue

        # Extract AMIS market ID from the market link or Graph link
        amis_market_id = _extract_market_id(cells)

        # cell_texts[1] is "Graph" -- skip it
        min_price = _to_float(cell_texts[2])
        max_price = _to_float(cell_texts[3])
        fqp_price = _to_float(cell_texts[4])
        quantity = _to_float(cell_texts[5]) if len(cell_texts) > 5 else None

        # Skip rows where ALL prices are missing (commodity not traded today)
        if min_price is None and max_price is None and fqp_price is None:
            continue

        prices.append(MarketPrice(
            commodity_name=commodity_name,
            market_name=market_name,
            date=page_date,
            min_price=min_price,
            max_price=max_price,
            fqp_price=fqp_price,
            quantity=quantity,
            unit=unit,
            amis_market_id=amis_market_id,
        ))

    return prices


def _extract_market_name(td: Tag) -> Optional[str]:
    """
    Extract market name from the first cell of a data row.

    The cell typically looks like:
        <td>&nbsp;<b>3&nbsp;<a href="...">Rawalpindi</a></b></td>

    We prefer the <a> text; fall back to stripping digits/whitespace
    from the cell text.
    """
    link = td.find("a")
    if link:
        name = link.get_text(strip=True)
        if name:
            return name

    # Fallback: strip row number and whitespace
    text = td.get_text(strip=True)
    cleaned = re.sub(r"^\d+\s*", "", text).strip()
    return cleaned if cleaned else None


_MARKET_ID_RE = re.compile(r"commodityId=(\d+)")
_GRAPH_CITY_RE = re.compile(r"city=(\d+)")


def _extract_market_id(cells: list[Tag]) -> Optional[int]:
    """
    Extract the AMIS market/city ID from a data row.

    The first cell's <a> href contains ``searchType=1&commodityId=<market_id>``.
    The second cell (Graph) contains ``city=<market_id>``.
    """
    # Try market name link (cell 0)
    link = cells[0].find("a", href=True)
    if link:
        m = _MARKET_ID_RE.search(link["href"])
        if m:
            return int(m.group(1))

    # Try Graph link (cell 1) -- has city=<id>
    if len(cells) > 1:
        graph_link = cells[1].find("a", href=True)
        if graph_link:
            m = _GRAPH_CITY_RE.search(graph_link["href"])
            if m:
                return int(m.group(1))

    return None


def _to_float(text: str) -> Optional[float]:
    """
    Convert a cell text to float.  Returns ``None`` for missing data
    (represented as '-' or empty string on AMIS).
    """
    cleaned = text.strip().replace(",", "")
    if not cleaned or cleaned == "-":
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


# ---------------------------------------------------------------------------
# Public convenience
# ---------------------------------------------------------------------------


def scrape_all(
    commodities: list[CommodityInfo],
    *,
    filter_ids: set[int] | None = None,
) -> tuple[list[MarketPrice], int, int]:
    """
    Scrape prices for every commodity.

    Parameters
    ----------
    commodities : list[CommodityInfo]
        Discovered commodities (from ``discover_commodities``).
    filter_ids : set[int] | None
        If provided, only scrape commodities whose ID is in this set.

    Returns
    -------
    (all_prices, success_count, fail_count)
    """
    session = _build_session()
    all_prices: list[MarketPrice] = []
    success = 0
    fail = 0

    for ci in commodities:
        if filter_ids and ci.commodity_id not in filter_ids:
            continue

        logger.info(
            "Scraping commodity %d: %s", ci.commodity_id, ci.name,
        )
        result = fetch_and_parse(session, ci.commodity_id)
        if result and result.prices:
            all_prices.extend(result.prices)
            success += 1
            logger.info(
                "  -> %d market rows for %s (%s)",
                len(result.prices), result.commodity_name, result.date,
            )
        else:
            fail += 1
            logger.warning(
                "  -> No data for commodity %d (%s).",
                ci.commodity_id, ci.name,
            )

        time.sleep(config.REQUEST_DELAY)

    return all_prices, success, fail
