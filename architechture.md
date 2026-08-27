# Green Flora — Architecture

## 1. System Overview

Green Flora is a multi-page web application with a **Next.js frontend**, **FastAPI backend**, **Supabase PostgreSQL database**, and **AI services**.

```text
                    FARMER
                       │
              ┌────────┴────────┐
              │                 │
            Web UI            Voice
              │                 │
              └────────┬────────┘
                       ▼
                Next.js Frontend
                       │
                    REST API
                       │
                       ▼
                 FastAPI Backend
                       │
        ┌──────────────┼──────────────┐
        │              │              │
     Services        Agents        AI/LLM
        │              │              │
        └──────────────┼──────────────┘
                       │
             ┌─────────┴─────────┐
             │                   │
         Supabase             External APIs
        PostgreSQL          Weather / Market
```

## 2. Frontend

Use **Next.js + React + TypeScript + Tailwind CSS**.

Main pages:

```text
/dashboard
/my-farm
/weather
/crop-doctor
/market
/mechanization
/experts
/voice-assistant
/farm-costs
/settings
```

Reusable components should be placed in:

```text
frontend/
├── app/
├── components/
├── services/
├── hooks/
└── types/
```

The frontend communicates with the backend through REST APIs.

---

## 3. Backend

Use **Python + FastAPI**.

```text
backend/
├── main.py
├── routes/
├── agents/
├── services/
├── models/
├── schemas/
└── config/
```

### Routes

Handle frontend requests:

* Weather
* Market
* Crop disease
* Farm/profile
* Machinery
* Experts
* Voice/AI assistant

### Services

Handle external integrations:

* AI/LLM
* Weather API
* Market data
* Supabase
* Image processing

### Agents

Modular decision-making components:

* Farm Assistant
* Weather Agent
* Market Agent
* Crop Health Agent
* Mechanization Agent
* Budget Agent
* Expert/Escalation Agent

---

## 4. AI Architecture

The **Farm Assistant** is the central coordinator.

```text
Farmer Question
      ↓
Farm Assistant
      ↓
Identify Intent
      ↓
Relevant Agent/Service
      ↓
Farm + External Data
      ↓
AI Reasoning
      ↓
Farmer-friendly Response
```

Voice and text should use the **same Farm Assistant**.

---

## 5. Database

Use **Supabase PostgreSQL**.

Core tables:

```text
farmers
farms
fields
crops
market_prices
machinery
experts
bookings
```

Additional tables can be added when required by features.

---

## 6. External Integrations

Green Flora may integrate with:

* Weather API
* Gemini / OpenAI
* Market data sources
* OpenStreetMap/Leaflet

External services must have error handling and demo fallbacks where practical.

---

## 7. Demo Mode

The system should support demo/seeded data so the application remains functional if an external API is unavailable.

```text
Live Data → if unavailable → Demo Data
```

---

## 8. Core Architecture Principle

Keep the system **modular, simple, and scalable**.

The frontend should not contain business logic that belongs in the backend.

The backend should coordinate AI, data, and external services.

All AI modules should share the farmer's farm context so Green Flora behaves as **one connected agricultural assistant**, not a collection of separate features.
