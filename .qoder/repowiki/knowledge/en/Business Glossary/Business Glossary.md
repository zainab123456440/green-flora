---
kind: business_term
name: Business Glossary
category: business_term
scope:
    - '**'
---

### Phase 4
- Definition：Internal development milestone referring to the field creation workflow that lets farmers add fields to their farm, assign crops via the crop-cycle system, and see allocated vs remaining acreage update on the My Farm view.
- Aliases：phase 4

### Crop cycle
- Definition：The `crop_cycles` table linking a field to a planted crop and its growth stage; used to track what crop is growing on which field and to compute farm-level summaries such as allocated area.
- Aliases：crop_cycles

### My Farm
- Definition：The farmer-facing page where users manage their farm location, view existing fields, add new fields, and see total/allocated/remaining acreage breakdown.
- Aliases：my farm

### Government Support
- Definition：Feature section providing quick-access call buttons to free government agricultural helplines and support services for Pakistani farmers.
- Aliases：government helpline

### Profit Calculator
- Definition：Deterministic, browser-side financial tool that estimates total production, expected revenue, total farming cost, estimated profit, profit per acre, profit margin, and break-even selling price based on farmer-provided inputs without consuming AI/API credits.
- Aliases：profit calculator

### Voice Assistant
- Definition：Layer around the text AI assistant that records speech, transcribes it (STT), sends the text to the same assistant tools/data sources, and optionally reads the response back via text-to-speech; supports Urdu, English, and mixed input.
- Aliases：voice interaction、voice

### Demo mode
- Definition：Runtime switch (`DEMO_MODE=true`) that makes all services fall back to seeded demo data instead of hitting real databases or external APIs, used during local development when credentials are missing.
- Aliases：demo_mode
