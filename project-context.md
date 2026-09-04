ary
/
project context.md


Green Flora --- Final Project Context
Project Identity
Project Name: Green Flora
Project Type: AI-powered smart agriculture web application
Target Users: Pakistani farmers
Status: Completed final-term application
Primary Goal: Provide practical agricultural information, AI
assistance, market information, weather information, voice interaction,
and farm-profit calculations through one farmer-friendly platform.

1. Final Problem Statement
Farmers frequently need information from multiple sources before making
a farming decision. Weather, market prices, farm economics, and
agricultural product information are often separated across different
websites, applications, or informal sources.

Green Flora addresses this problem by providing a single web platform
where farmers can access important information and interact with an AI
assistant using normal language.

The application is designed to reduce information friction rather than
replace farmers or agricultural professionals.

2. Final Product Scope
The completed product contains the following major areas:

A. Farmer Dashboard
The dashboard provides a consolidated view of:

farmer/farm context;

current weather;

market highlights;

quick actions;

AI assistant;

important application information.

The interface is responsive and designed around a simple agricultural
visual identity.

B. Farmer Profile / My Farm
The application stores relevant farmer and farm information.

This context can be used by the dashboard, weather module, and AI
assistant.

C. Weather
Weather is provided through Open-Meteo.

The final implementation focuses on basic useful forecast information:

temperature;

feels-like temperature;

humidity;

precipitation;

weather condition;

wind;

forecast rainfall probability;

seven-day forecast.

It is not an advanced climate or precision-agriculture weather
model.

D. Market Trends and Daily Prices
The market module displays agricultural prices and trends using
structured data stored in Supabase/PostgreSQL.

The project includes an AMIS Pakistan data-ingestion workflow operated
through GitHub Actions.

The market system supports:

current/latest prices;

units;

historical movement;

trends;

market comparisons;

crop-name normalization;

dashboard market summaries.

E. AI Farming Assistant
The assistant is the main AI feature.

It can:

answer agricultural questions;

use farmer context;

retrieve weather;

retrieve market information;

search agricultural product data;

use web search when internal information is insufficient;

provide concise farmer-friendly answers;

respond in English, Urdu, or Roman Urdu according to the farmer's
input.

The primary reasoning model is GPT-5.6 Luna through the OpenAI Responses
API.

Gemini Flash is used as a transient-failure fallback.

F. Voice Assistant
Voice interaction allows the farmer to:

record speech;

transcribe it;

send the text to the same AI assistant;

receive the response;

optionally hear the response through text-to-speech.

Voice supports Urdu/English and mixed usage according to the
speech/model capabilities.

G. Agricultural Product Data
A structured agricultural-product dataset is available to the assistant.

It includes information such as:

agricultural category;

local problem;

scientific target;

brand;

company;

active ingredient/formulation;

dosage;

approximate price.

The AI is instructed to use this data rather than fabricate product
information.

H. Profit Calculator
The Profit Calculator is an important completed feature.

It estimates:

total production;

expected revenue;

total farming cost;

estimated profit;

profit per acre;

profit margin;

break-even selling price.

The calculations are deterministic and run locally in the browser.

This feature adds direct farm-economics support to the application.

I. Government Support
The final interface includes a government agriculture support/helpline
section.

This replaced the previously planned private agricultural expert-booking
experience.

3. Technology Context
Frontend
Next.js

React

TypeScript

Tailwind CSS

Recharts

Backend
Python

FastAPI

Pydantic

REST APIs

streaming/SSE for assistant responses

Database
Supabase

PostgreSQL

Row Level Security where applicable

AI
OpenAI Responses API

GPT-5.6 Luna

Gemini Flash fallback

GPT-4o-mini utility tasks

gpt-4o-mini-transcribe

gpt-4o-mini-tts

hosted web search

function/tool calling

External Data
Open-Meteo for weather

AMIS Pakistan for market data

Automation
GitHub Actions for scheduled AMIS market-data ingestion

Charts
Recharts

Deployment
cloud-hosted Next.js frontend;

cloud-hosted FastAPI backend;

managed Supabase database;

external AI/data APIs.

4. AI Assistant Context
The assistant is not intended to be a generic chatbot.

It is a domain-focused farming assistant with access to application
context and trusted tools.

Internal tools
The assistant can access:

get_weather
    ↓
Open-Meteo

get_crop_market_data
    ↓
Market service
    ↓
AMIS-ingested Supabase data

search_agricultural_products
    ↓
Supabase agricultural products
Web search is available when internal Green Flora information is
insufficient.

Source priority
The assistant follows:

Green Flora internal data
        ↓
External web search if necessary
        ↓
Answer
It must not guess structured agricultural data.

5. Language Context
The assistant is designed for Pakistani farmers and supports:

English;

Urdu script;

Roman Urdu;

mixed language questions.

Examples of supported farmer-style input include:

"Aaj gehu ka rate kya hai?"

"گندم کا آج کیا ریٹ ہے؟"

"What is the weather on my farm today?"

The assistant is instructed to match the language/script of the farmer's
latest message.

6. Data Integrity Context
A core project rule is:

Never fabricate data.

The AI should not invent:

weather values;

market prices;

agricultural product prices;

dosages;

dates;

market names;

unavailable data.

If a tool cannot retrieve information, it returns an unavailable state
so the assistant can communicate that limitation honestly.

This is especially important for agricultural and financial decision
support.

7. Profit Calculator Context
The calculator is intentionally independent of the AI.

Inputs
The farmer provides values such as:

farm acreage;

expected production;

selling price;

farming costs.

Outputs
The application calculates:

Total Production
Expected Revenue
Total Farming Cost
Estimated Profit
Profit per Acre
Profit Margin
Break-even Selling Price
Core formulas
Expected Revenue = Production × Selling Price

Estimated Profit = Expected Revenue − Total Cost

Profit per Acre = Estimated Profit ÷ Acres

Profit Margin = Estimated Profit ÷ Expected Revenue × 100

Break-even Price = Total Cost ÷ Production
Because the calculation is performed locally, it is fast and does not
consume AI/API credits.

8. Market Data Context
The project separates market-data collection from market presentation.

AMIS
 ↓
GitHub Actions
 ↓
Python ingestion
 ↓
Supabase
 ↓
Market UI / Dashboard / AI
This ensures that the market page and AI assistant can work from the
same structured source.

The AI does not generate market prices.

9. Weather Context
Weather follows the same data-integrity principle.

Farmer location
      ↓
Open-Meteo
      ↓
Current + forecast data
      ↓
Weather page
      +
Dashboard
      +
AI assistant
The final weather system is intentionally straightforward and useful.

It does not claim:

satellite weather;

sensor-based soil intelligence;

advanced crop-risk forecasting;

climate prediction;

precision-agriculture analytics.

10. Voice Context
Voice is a layer around the existing assistant rather than a separate
intelligence system.

Voice Input
    ↓
Speech-to-Text
    ↓
Normal AI Assistant
    ↓
Text Response
    ↓
Text-to-Speech
The same assistant tools and data sources are used for voice and text.

11. Security Context
The application uses environment variables for secrets and keeps
external API credentials on the backend.

Important security practices include:

secret management through environment variables;

no API keys in frontend code;

database access policies;

request validation;

CORS configuration;

bounded input sizes;

graceful external-service failure handling.

12. Reliability Context
The assistant contains fallback and failure-handling logic.

OpenAI transient failure
OpenAI
  │
  ├── success → answer
  │
  └── transient failure → Gemini fallback
Voice failure
STT fails → typed input remains available

TTS fails → written answer remains available
Data failure
Data unavailable
      ↓
Do not fabricate
      ↓
Tell the farmer honestly
13. Final Scope Boundary
The following were discussed during project planning but are not part
of the completed final application:

Not implemented
computer vision;

crop disease image classification;

crop image diagnosis;

vision models;

PAI-EAS vision deployment;

satellite imagery;

drone imagery;

IoT sensors;

precision agriculture;

advanced soil intelligence;

machinery recommendation;

machinery marketplace;

expert profiles/booking;

Qdrant;

RAG pipeline;

LangGraph multi-agent system;

n8n orchestration.

These must not be described as completed functionality in the final
submission.

14. Why the Final Architecture Is Appropriate
The project intentionally uses a smaller, defensible architecture
instead of adding technologies only for presentation.

For example:

Weather uses a real weather API.

Market prices use structured AMIS-derived data.

The AI uses function tools to access trusted data.

Web search is used as a fallback for information outside internal
datasets.

Profit calculations are deterministic and local.

Voice uses the same assistant rather than duplicating AI logic.

Supabase stores persistent application data.

GitHub Actions automates market-data refreshes.

This creates a coherent full-stack application rather than a collection
of unrelated demonstrations.

15. Final Project Summary
Green Flora is a completed smart agriculture platform for Pakistani
farmers.

Its final implementation combines:

Farmer Context + Weather + Market Data + AI Assistant + Voice +
Agricultural Product Information + Profit Calculator + Government
Support

into one web application.

The project demonstrates full-stack software engineering, API
integration, database design, scheduled data ingestion, AI tool calling,
conversational UX, speech processing, deterministic financial
calculations, and deployment-oriented engineering.

The final documentation should describe these implemented capabilities
accurately and should not include earlier experimental or planned
features as if they were completed.
