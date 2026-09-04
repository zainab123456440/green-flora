---
kind: external_dependency
name: Open-Meteo (weather data source)
slug: open-meteo
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
---

Free weather data provider supplying current conditions and seven-day forecasts (temperature, feels-like, humidity, precipitation, condition, wind, rainfall probability) consumed by the Weather page, Dashboard, and AI assistant tools. The project intentionally treats weather as straightforward forecast data and does not claim satellite imagery, sensor-based soil intelligence, or precision-agriculture forecasting. When integrating, call the Open-Meteo REST endpoints with the farm's latitude/longitude stored in the `farms` record.