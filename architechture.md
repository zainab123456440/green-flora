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

market retrieval;

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

Saved farm location
       │
       ▼
FastAPI weather service
       │
       ▼
Open-Meteo
       │
       ▼
Current weather + 7-day forecast
       │
       ├──► Weather page
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
     │
     ▼
FastAPI assistant endpoint
     │
     ▼
Conversation sanitization
     │
     ▼
Farmer/farm context
     │
     ▼
GPT-5.6 Luna
     │
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

                    GREEN FLORA
                         │
            ┌────────────┴────────────┐
            │                         │
       Farmer UI                 AI Assistant
            │                         │
            ▼                         ▼
       Next.js/React             GPT-5.6 Luna
            │                    + tools
            │                         │
            └────────────┬────────────┘
                         ▼
                       FastAPI
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
         Supabase    Open-Meteo    AI Providers
             │
             ▼
        Market Data
             ▲
             │
       GitHub Actions
             ▲
             │
            AMIS

The architecture is modular, data-aware, and suitable for future
expansion while remaining faithful to the features actually implemented
in the completed application.