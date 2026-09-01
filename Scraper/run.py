"""
run.py

CLI entry-point for the AMIS market-data ingestion pipeline.

Usage:
    python -m Scraper.run                       # full run
    python -m Scraper.run --dry-run             # scrape only, no DB writes
    python -m Scraper.run --commodity-ids 1,88  # specific commodities
    python -m Scraper.run --dry-run --commodity-ids 1,88
"""

import argparse
import logging
import sys

from Scraper.pipeline import run_pipeline


def _setup_logging() -> None:
    """Configure structured logging to stdout."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        stream=sys.stdout,
    )
    # Quiet noisy third-party loggers
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("supabase").setLevel(logging.WARNING)


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="AMIS Pakistan market-data scraper for Green Flora.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Scrape and parse but do NOT write to Supabase.",
    )
    parser.add_argument(
        "--commodity-ids",
        type=str,
        default=None,
        help="Comma-separated commodity IDs to scrape (e.g. '1,88,41').",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable DEBUG-level logging.",
    )
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    _setup_logging()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    filter_ids: set[int] | None = None
    if args.commodity_ids:
        filter_ids = {
            int(x.strip()) for x in args.commodity_ids.split(",") if x.strip()
        }

    return run_pipeline(
        dry_run=args.dry_run,
        filter_ids=filter_ids,
    )


if __name__ == "__main__":
    sys.exit(main())
