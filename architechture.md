<<<<<<< HEAD
Green Flora --- System Architecture

1. Architecture Overview

Green Flora is a full-stack agricultural decision-support web
application.

The final architecture is intentionally practical:

Farmer
  │
  ▼
Next.js / React Frontend
  │
  │ HTTPS / REST / SSE
  ▼
FastAPI Backend
  │
  ├──────────────► Supabase / PostgreSQL
  │
  ├──────────────► Open-Meteo
  │
  ├──────────────► OpenAI
  │
  └──────────────► Gemini fallback

A separate scheduled ingestion path supplies market data:

=======
# Green Flora — System Architecture

## 1. Architecture Overview

Green Flora is a full-stack agricultural decision-support web application. The final architecture is intentionally practical, relying on direct API integrations and structured data rather than complex local pipelines:

```
Farmer
  │
  ▼
Next.js / React Frontend
  │
  │ HTTPS / REST / SSE
  ▼
FastAPI Backend
  │
  ├──────────────► Supabase / PostgreSQL
  │
  ├──────────────► Open-Meteo
  │
  ├──────────────► OpenAI (GPT-5.6 Luna)
  │
  └──────────────► Gemini Fallback

```

A separate scheduled ingestion path supplies market data:

```
>>>>>>> 64e109036331df89ddebc9672ea4bfb2d0889547
AMIS Pakistan
      │
      ▼
GitHub Actions
      │
      ▼
Python ingestion / cleaning
      │
      ▼
Supabase PostgreSQL
      │
      ├──► Market page
      ├──► Dashboard
      └──► AI Assistant
<<<<<<< HEAD

2. Architectural Goals

The system was designed to satisfy five main goals:

Give farmers one simple application instead of several disconnected
tools.

Keep changing agricultural data separate from AI-generated language.

Use trusted internal data first for weather, market prices, and
agricultural products.

Keep expensive AI calls limited to tasks that benefit from language
reasoning.

Keep deterministic calculations, such as profit calculation, local
and predictable.

3. Frontend Architecture

Technology

Next.js

React

TypeScript

Tailwind CSS

Recharts

Main UI areas

Frontend
│
├── Landing / Entry
├── Authentication
├── Dashboard
├── My Farm / Profile
├── Weather
├── Market
├── Profit Calculator
├── AI Assistant
├── Voice Interaction
└── Government Support

Responsibilities

The frontend is responsible for:

rendering pages and components;

collecting farmer input;

displaying API results;

handling loading/error/empty states;

maintaining assistant interaction state;

recording microphone input;

playing TTS audio;

performing profit calculations locally;

displaying market charts;

providing responsive navigation.

The frontend does not contain secret API credentials.

4. Backend Architecture

The backend uses FastAPI and follows a route → service → data/provider
pattern.

HTTP Request
     │
     ▼
FastAPI Route
     │
     ▼
Validation / Schema
     │
     ▼
Service Layer
     │
     ├── Supabase
     ├── Open-Meteo
     ├── OpenAI
     └── Gemini
     │
     ▼
Structured Response
     │
     ▼
Frontend

Backend responsibilities

authentication/session-related API handling;

farmer profile access;

farm information;

weather retrieval;
=======

```
>>>>>>> 64e109036331df89ddebc9672ea4bfb2d0889547

market retrieval;

<<<<<<< HEAD
AI assistant orchestration;

voice transcription;

text-to-speech;

agricultural product lookup;

API validation;

error handling;

provider fallback.

5. Database Architecture

Supabase provides the PostgreSQL database layer.

The database stores structured application information instead of
relying on the LLM as a database.

Important logical data areas include:

=======
## 2. Architectural Goals

The system was designed to satisfy five main goals:

* **Unified Access:** Give farmers one simple application instead of several disconnected tools.
* **Data Integrity Separation:** Keep changing agricultural data separate from AI-generated language.
* **Authoritative First:** Use trusted internal data first for weather, market prices, and agricultural products.
* **Targeted AI Workloads:** Keep expensive AI calls limited strictly to tasks that benefit from language reasoning.
* **Predictable Math:** Keep deterministic calculations, such as profit calculation, local and predictable.

---

## 3. Frontend Architecture

**Technology Stack:** Next.js, React, TypeScript, Tailwind CSS, Recharts.

```
Frontend
│
├── Landing / Entry
├── Authentication
├── Dashboard
├── My Farm / Profile
├── Weather
├── Market
├── Profit Calculator
├── AI Assistant
├── Voice Interaction
└── Government Support

```

**Responsibilities:**

* Rendering pages, data charts, and accessible dashboard components.
* Collecting farmer input and managing profile state.
* Displaying API responses and handling loading, empty, and error boundaries.
* Recording browser microphone input and playing synthesized audio (TTS).
* Executing profit calculations client-side without network latency.
* Displaying real-time commodity pricing and historical price trends.
* Maintaining zero exposed secret API credentials in client bundles.

---

## 4. Backend Architecture

The backend uses FastAPI and follows a strict `Route → Service → Provider / Database` design pattern:

```
HTTP Request
     │
     ▼
FastAPI Route
     │
     ▼
Validation / Schema (Pydantic)
     │
     ▼
Service Layer
     │
     ├── Supabase
     ├── Open-Meteo
     ├── OpenAI
     └── Gemini
     │
     ▼
Structured Response / SSE Stream
     │
     ▼
Frontend

```

**Responsibilities:**

* Farmer session handling and profile management.
* Weather and forecast data orchestration via Open-Meteo.
* Market price queries from normalized Supabase tables.
* Agricultural chemical and product catalog lookups.
* AI assistant execution, tool routing, and streaming output via Server-Sent Events (SSE).
* Audio transcription and speech synthesis orchestration.
* Failover handling between primary and secondary LLM providers.

---

## 5. Database Architecture

Supabase provides the PostgreSQL database layer. The system stores verified, structured data in tables instead of using an LLM or vector database:

```
>>>>>>> 64e109036331df89ddebc9672ea4bfb2d0889547
farmer_profiles
      │
      ├── farm information
      ├── crop information
      └── location/context

market data
      │
      ├── commodities
      ├── current prices
      ├── historical prices
      └── market metadata

agricultural_products
      │
<<<<<<< HEAD
      ├── category
      ├── target/problem
      ├── brand/company
      ├── active ingredient
      ├── dosage
      └── price information

The final application does not require a vector database for its core
operation.

6. Weather Architecture

The weather system uses Open-Meteo.

=======
      ├── category (herbicide, pesticide, fertilizer)
      ├── target problem / pest
      ├── brand & manufacturer
      ├── active ingredient
      ├── recommended dosage
      └── price information

```

The application does not require a vector database for its core operations.

---

## 6. Weather Architecture

The weather system integrates with the Open-Meteo API using saved farm coordinates:

```
>>>>>>> 64e109036331df89ddebc9672ea4bfb2d0889547
Saved farm location
       │
       ▼
FastAPI weather service
       │
       ▼
<<<<<<< HEAD
Open-Meteo
=======
Open-Meteo API
>>>>>>> 64e109036331df89ddebc9672ea4bfb2d0889547
       │
       ▼
Current weather + 7-day forecast
       │
       ├──► Weather page
<<<<<<< HEAD
       ├──► Dashboard
       └──► AI Assistant tool

Weather data used

temperature;

apparent temperature;

humidity;

precipitation;

weather condition;

wind;

forecast rainfall probability;

forecast wind;

daily forecast.

The system intentionally does not claim advanced agricultural climate
modelling.

7. Market Architecture

The market system has two parts:

Data ingestion.

Application consumption.

Ingestion

AMIS Pakistan
      │
      ▼
Scheduled GitHub Action
      │
      ▼
Python scraper/ingestion logic
      │
      ▼
Clean / normalize
      │
      ▼
Supabase

Consumption

Supabase
   │
   ├──► Market page
   │       ├── current price
   │       ├── comparisons
   │       └── trend chart
   │
   ├──► Dashboard
   │
   └──► AI Assistant

The assistant uses the same market service/database rather than
maintaining a second hidden market dataset.

8. AI Assistant Architecture

The assistant is a tool-using AI service.

Primary model

GPT-5.6 Luna via OpenAI Responses API

Fallback

Gemini Flash, used when OpenAI encounters a transient failure such
as a timeout, rate limit, connection issue, or server-side error.

Utility model

GPT-4o-mini is used for inexpensive utility operations where
appropriate.

Assistant flow

User message
=======
       ├──► Dashboard overview
       └──► AI Assistant tool context

```

**Retrieved Metrics:**

* Temperature and apparent ("feels like") temperature
* Relative humidity and precipitation
* Wind speed and gust forecasts
* Precipitation probability and daily weather code summaries

The architecture intentionally avoids unverified agricultural micro-climate modeling in favor of reliable forecast metrics.

---

## 7. Market Architecture

```
[Ingestion Pipeline]
AMIS Pakistan Portal (Daily)
      │
      ▼
Scheduled GitHub Action (CRON)
      │
      ▼
Python scraper & normalizer
      │
      ▼
Supabase PostgreSQL

[Application Consumption]
Supabase PostgreSQL
   │
   ├──► Market Page (Commodity tables, comparisons, Recharts trends)
   ├──► Dashboard (Top traded commodities & quick indicators)
   └──► AI Assistant (Direct tool queries for exact pricing)

```

The AI assistant queries the exact same database records as the frontend UI, preventing hallucinated commodity prices.

---

## 8. AI Assistant Architecture

The assistant is an orchestration-layer tool-calling service:

* **Primary Model:** GPT-5.6 Luna via the OpenAI Responses API.
* **Fallback Model:** Gemini Flash, invoked automatically if OpenAI encounters timeouts, rate limits, or network interruptions.
* **Utility Operations:** GPT-4o-mini for low-cost token tasks where applicable.

```
User Message
>>>>>>> 64e109036331df89ddebc9672ea4bfb2d0889547
     │
     ▼
FastAPI assistant endpoint
     │
     ▼
<<<<<<< HEAD
Conversation sanitization
     │
     ▼
Farmer/farm context
=======
Conversation sanitization & profile injection
>>>>>>> 64e109036331df89ddebc9672ea4bfb2d0889547
     │
     ▼
GPT-5.6 Luna
     │
<<<<<<< HEAD
     ├── get_weather
     │
     ├── get_crop_market_data
     │
     ├── search_agricultural_products
     │
     └── web_search
     │
     ▼
Tool results
     │
     ▼
Final response
     │
     ▼
SSE stream
     │
     ▼
Next.js assistant UI

Tool priority

The assistant follows this order:

Green Flora internal data;

external web search only when internal data is insufficient;

no invented numerical values.

For example:

"Today's wheat price?"
        │
        ▼
AMIS/Supabase tool
        │
        ▼
Return current available market data

Instead of:

LLM guesses a wheat price

9. AI Data Integrity

The system explicitly instructs the assistant:

never fabricate weather;

never fabricate market prices;

never fabricate agricultural product prices;

never fabricate dosage information;

clearly report unavailable information;

prefer Green Flora's internal data over web search;

use web search for information outside the internal dataset.

This creates a separation between:

Reliable structured data
          +
AI language/reasoning
          =
Farmer-friendly answer

10. Voice Architecture

The voice layer is built around the same assistant.

Microphone
    │
    ▼
Browser audio recording
    │
    ▼
Speech-to-text
    │
    ▼
Assistant
    │
    ▼
Text response
    │
    ▼
Text-to-speech
    │
    ▼
Audio playback

Voice state machine

ready
  ↓
listening
  ↓
transcribing
  ↓
thinking
  ↓
generating
  ↓
speaking
  ↓
ready

Failures are isolated:

transcription failure does not disable typed chat;

TTS failure does not remove the written answer;

assistant errors can be retried.

11. Profit Calculator Architecture

The profit calculator is deliberately deterministic.

User Inputs
   │
   ├── acreage
   ├── expected production
   ├── selling price
   └── farming costs
        │
        ▼
Local TypeScript calculations
        │
        ├── Revenue
        ├── Total Cost
        ├── Profit
        ├── Profit/Acre
        ├── Margin
        └── Break-even Price

No OpenAI request is required.

Core formulas

Revenue = Total Production × Selling Price

Profit = Revenue − Total Cost

Profit per Acre = Profit ÷ Acreage

Profit Margin = (Profit ÷ Revenue) × 100

Break-even Selling Price = Total Cost ÷ Total Production

The exact units are determined by the values entered by the farmer.

12. Security Architecture

Secrets remain server-side.

Browser
   │
   │ no secret API keys
   ▼
FastAPI
   │
   ├── OpenAI credentials
   ├── Gemini credentials
   └── Supabase service credentials

The application uses:

environment variables;

backend-only API credentials;

validation;

controlled CORS;

database access policies;

bounded request sizes;

error handling.

13. Reliability Architecture

The AI layer includes:

OpenAI request
     │
     ├── success ─────────────► response
     │
     └── transient failure
                │
                ▼
          Gemini fallback
                │
                ▼
             response

The assistant also uses:

request timeouts;

rate-limit handling;

connection error handling;

server-error handling;

maximum tool hops;

maximum conversation history;

maximum message length;

maximum audio size;

friendly retryable errors.

14. Deployment Architecture

The final deployment model is:

User Browser
     │
     ▼
Cloud-hosted Next.js
     │
     │ HTTPS
     ▼
Cloud-hosted FastAPI
     │
     ├──► Supabase
     ├──► Open-Meteo
     ├──► OpenAI
     └──► Gemini

Scheduled market updates operate independently:

GitHub Actions
     │
     ▼
AMIS
     │
     ▼
Supabase

This means a temporary AI outage does not prevent the market database
from being updated.

15. Final Architecture Boundary

The following components are explicitly outside the final architecture:

computer vision;

crop-image disease models;

satellite/drone processing;

IoT field sensors;

precision-agriculture prediction;

machinery recommendation marketplace;

expert booking system;

Qdrant vector retrieval;

large multi-agent LangGraph implementation;

n8n orchestration.

These can be added later without changing the fundamental
frontend/backend/database separation.

16. Architecture Summary

Green Flora can therefore be summarized as:

=======
     ├── Tool: get_weather
     ├── Tool: get_crop_market_data
     ├── Tool: search_agricultural_products
     └── Tool: web_search (supplementary only)
     │
     ▼
Tool execution & structured aggregation
     │
     ▼
Response generation (SSE stream)
     │
     ▼
Next.js UI

```

**Data Priority Order:**

1. Green Flora internal Supabase records (Market prices, product database).
2. Open-Meteo verified forecast data.
3. Live web search (only when internal tables have no coverage).
4. Strict refusal to fabricate numerical figures or dosages.

---

## 9. AI Data Integrity

To protect farmers from catastrophic advice, system prompts enforce the following rules:

* Never fabricate weather or precipitation forecasts.
* Never invent commodity rates or trading values.
* Never estimate pesticide chemical formulations, dosages, or safety intervals without database records.
* Explicitly declare when data is unavailable rather than generating approximations.
* Prefer verified local market tables over general internet search results.

---

## 10. Voice Architecture

Voice interactions are processed through browser Web APIs and backend audio pipelines:

```
Browser Microphone
       │
       ▼
MediaRecorder audio capture
       │
       ▼
FastAPI speech-to-text service
       │
       ▼
AI Assistant reasoning pipeline
       │
       ▼
Text response generated
       │
       ▼
Text-to-speech engine
       │
       ▼
Browser audio playback

```

**State Lifecycle:**


$$\text{ready} \longrightarrow \text{listening} \longrightarrow \text{transcribing} \longrightarrow \text{thinking} \longrightarrow \text{generating} \longrightarrow \text{speaking} \longrightarrow \text{ready}$$

*Isolation guarantee:* Audio failures fail gracefully to typed text without locking the interface.

---

## 11. Profit Calculator Architecture

The profit calculator runs client-side in TypeScript without triggering backend API calls or AI inference:

```
User Inputs (Acreage, Expected Yield, Selling Price, Production Costs)
       │
       ▼
Client-Side Deterministic Math
       │
       ├── Revenue = Total Production × Selling Price
       ├── Total Cost = Sum of Input Costs
       ├── Net Profit = Revenue − Total Cost
       ├── Profit per Acre = Net Profit ÷ Acreage
       ├── Profit Margin (%) = (Net Profit ÷ Revenue) × 100
       └── Break-even Price = Total Cost ÷ Total Production

```

---

## 12. Security & Reliability

**Security:**

* Zero API keys stored or accessible on the client side.
* FastAPI handles all third-party provider credentials securely via environment variables.
* Database interaction protected by Supabase Row-Level Security (RLS).
* Enforced payload boundaries and CORS origin restriction.

**Fault Tolerance:**

* OpenAI calls fail over to Gemini Flash upon upstream service disruption.
* Request timeout controls, token constraints, and message history length limits prevent cascading latency.
* Automated GitHub Actions run independently of web server uptime.

---

## 13. System Boundaries & Unimplemented Features

To preserve architectural clarity, the following components are explicitly **out of scope** and **not implemented** in the production application:

* **Computer Vision & Leaf Scanning:** No on-device convolutional networks, YOLO models, or leaf disease image classification pipelines.
* **Direct Geolocation Pesticide Store Mapping:** No live GPS radius querying, Google Maps Places integration, or physical shop inventory trackers.
* **Telecom / IVR Telephony Infrastructure:** Voice interactions operate strictly within the browser Web Audio API; there is no dial-in telephone gateway or cellular IVR system.
* **Automated Government Support Ticketing:** The platform provides direct click-to-call links to official helplines rather than a programmatic CRM or ticketing API.
* **Satellite & Remote Sensing Data:** No integration with Sentinel/Landsat feeds, NDVI vegetation index calculation, or drone survey processing.
* **IoT & Telemetry Hardware:** No physical soil moisture probes, automated drip-irrigation relays, or weather station hardware collectors.
* **Vector Search & Orchestration Overhead:** No LangGraph multi-agent clusters, n8n visual automation webhooks, or external vector stores (e.g., Qdrant, Pinecone).
* **Fintech & Credit Underwriting:** No micro-lending modules, credit scoring algorithms, or banking transaction processors.

---

## 14. Architecture Summary

```
>>>>>>> 64e109036331df89ddebc9672ea4bfb2d0889547
                    GREEN FLORA
                         │
            ┌────────────┴────────────┐
            │                         │
       Farmer UI                 AI Assistant
            │                         │
            ▼                         ▼
<<<<<<< HEAD
       Next.js/React             GPT-5.6 Luna
            │                    + tools
            │                         │
            └────────────┬────────────┘
                         ▼
                       FastAPI
=======
       Next.js / React           GPT-5.6 Luna
            │                    (Gemini Fallback)
            │                         │
            └────────────┬────────────┘
                         ▼
                   FastAPI Backend
>>>>>>> 64e109036331df89ddebc9672ea4bfb2d0889547
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
         Supabase    Open-Meteo    AI Providers
<<<<<<< HEAD
=======
        (PostgreSQL)
>>>>>>> 64e109036331df89ddebc9672ea4bfb2d0889547
             │
             ▼
        Market Data
             ▲
             │
       GitHub Actions
             ▲
             │
<<<<<<< HEAD
            AMIS

The architecture is modular, data-aware, and suitable for future
expansion while remaining faithful to the features actually implemented
in the completed application.
=======
       AMIS Pakistan

```
>>>>>>> 64e109036331df89ddebc9672ea4bfb2d0889547
