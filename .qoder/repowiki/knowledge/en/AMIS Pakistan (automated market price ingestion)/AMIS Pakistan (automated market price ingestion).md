---
kind: external_dependency
name: AMIS Pakistan (automated market price ingestion)
slug: amis-pakistan
category: external_dependency
scope:
    - '**'
---

External agricultural commodity price portal whose data is scraped by a standalone Python scraper (`Scraper/`) and persisted into Supabase. Ingestion runs automatically via GitHub Actions (`amis-scraper.yml`) on a schedule, then the Market service exposes the structured data to the dashboard, AI assistant tool `get_crop_market_data`, and profit calculator. The scraper depends on `requests`, `beautifulsoup4`, `supabase`, and `python-dotenv`. Do not fabricate market prices — the AI must only report values already ingested from AMIS.