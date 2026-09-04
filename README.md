# 🌾 Green Flora

**An Intelligent, Voice-First Dashboard Empowering Pakistani Farmers**

Green Flora is a comprehensive agricultural platform designed to bridge the technology gap for farmers in Pakistan. By leveraging cutting-edge cloud AI (Gemini API and GPT-4.6-turbo) alongside real-time localized data streams, the platform delivers actionable insights, automated market rates, and rapid disease analysis directly through an intuitive, accessible dashboard.

## ✨ Core Features

*   **📊 Comprehensive Farmer Dashboard:** A centralized, easy-to-read hub providing farmers with all their critical data—from crop health to financial forecasts—at a single glance.
*   **🌿 AI Plant Disease Analysis:** Users can upload a photo of a sick plant, and the system utilizes the **Gemini API** to instantly analyze the image, diagnose diseases, and recommend actionable treatments, eliminating the need for heavy local machine learning models.
*   **🎙️ Voice-First Assistant:** Integrated with **GPT-4.6-turbo**, the platform allows farmers to ask questions and interact using natural voice commands, effectively bypassing literacy and language barriers.
*   **📈 Local Resources & Automated Market Rates:** The platform automatically fetches and displays daily agricultural commodity prices across Pakistan directly from the **AMIS (Agriculture Marketing Information Service)** portal. A built-in profit calculator uses this real-time data to help farmers instantly estimate potential earnings based on exact, current market values.
*   **🌤️ Weather-Based Insights:** Delivers dynamic agronomic recommendations and predictive alerts tailored to real-time local weather conditions.
*   **📞 Direct Government Support:** Features quick-access call buttons that connect farmers instantly to free government agricultural helplines and support services.
*   **🗺️ Localized Resources:** Maps and guides farmers to nearby pesticide and fertilizer vendors based on their analysis results.

## 🛠️ Tech Stack

*   **Frontend:** Next.js, React, Tailwind CSS
*   **Backend:** Python, FastAPI
*   **Database:** Supabase (PostgreSQL for user data, market trends, and history)
*   **Image Analysis Engine:** Gemini API (Multimodal disease detection)
*   **Voice & Conversational AI:** GPT-4.6-turbo
*   **Live Data Integrations:** AMIS (amis.pk) for automated daily market prices in Pakistan

## 📖 Documentation

Comprehensive project documentation is available in the [`docs/`](docs/) folder, covering:

| Section | Description |
|---------|-------------|
| [Project Overview](docs/Project%20Overview.md) | High-level goals, target users, and platform scope |
| [Getting Started](docs/Getting%20Started.md) | Prerequisites, setup, and first-run instructions |
| [Configuration & Deployment](docs/Configuration%20and%20Deployment.md) | Environment variables, build configs, and deployment |
| [System Architecture](docs/System%20Architecture/System%20Architecture.md) | Data flow, database design, and service topology |
| [Backend API Reference](docs/Backend%20API%20Reference/Backend%20API%20Reference.md) | Endpoint docs for auth, farmer, field, market, assistant, crop-doctor, and support APIs |
| [Frontend Application](docs/Frontend%20Application/Frontend%20Application.md) | Component hierarchy, state management, and feature modules |
| [AI Integration](docs/AI%20Integration/AI%20Integration.md) | OpenAI assistant, Gemini API, and tool orchestration |
| [Market Data Pipeline](docs/Market%20Data%20Pipeline.md) | AMIS scraping engine, data transformation, and scheduling |
| [Weather Integration](docs/Weather%20Integration.md) | Open-Meteo service and agronomic alert logic |
| [Data Models & Database Schema](docs/Data%20Models%20and%20Database%20Schema.md) | Supabase table design and relationships |
| [Security Considerations](docs/Security%20Considerations.md) | Auth flow, RLS policies, and secret management |
| [Testing Strategy](docs/Testing%20Strategy.md) | Unit, integration, and end-to-end testing approach |
| [Troubleshooting Guide](docs/Troubleshooting%20Guide.md) | Common issues and resolution steps |
| [Performance Optimization](docs/Performance%20Optimization.md) | Caching, lazy loading, and query tuning tips |

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+
*   Python 3.10+
*   API Keys for Gemini, OpenAI (GPT-4.6-turbo), and Supabase.

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/zainab123456440/green-flora.git
   cd green-flora
   ```

2. **Backend setup**
   ```bash
   cd Backend
   pip install -r ../requirements.txt
   # Add your API keys to Backend/.env
   uvicorn main:app --reload
   ```

3. **Frontend setup**
   ```bash
   cd Frontend/greenflora
   npm install
   # Add your API keys to Frontend/greenflora/.env
   npm run dev
   ```

4. **AMIS Scraper** _(optional — for market data ingestion)_
   ```bash
   cd Scraper
   pip install -r requirements.txt
   python run.py
   ```

## 📁 Project Structure

```
green-flora/
├── Backend/          # FastAPI server — routes, services, models, schemas
├── Frontend/         # Next.js app — pages, components, hooks, services
│   └── greenflora/
├── Scraper/          # AMIS market-data scraping pipeline
├── docs/             # Project documentation (see above)
└── .github/          # CI/CD workflows
```

## 🤝 Contributing

Before contributing, please read the [Project Overview](docs/Project%20Overview.md) and [System Architecture](docs/System%20Architecture/System%20Architecture.md) docs to understand the platform's goals and design.
