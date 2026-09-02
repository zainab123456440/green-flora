# Green Flora 🌱

**An AI-powered farming companion**

Green Flora helps farmers make smarter, faster, and more informed farming decisions by combining location-based weather information, crop disease detection, agricultural market price trends, government farmer support, and an AI-powered assistant — all in one connected platform.

## Features

* 🌦️ **Weather & Irrigation Advisory** — location-based weather information with agricultural insights and recommendations.

* 🌿 **Crop Disease Detection** — upload a crop image and receive an AI-assisted disease analysis.

* 🏛️ **Government Farmer Support** — connect farmers with official government agricultural support through a publicly available farmer helpline. Green Flora does not maintain an individual expert directory or appointment-booking system.

* 📈 **Market Price Trends** — view agricultural crop prices and price trends using available Pakistan market data, with prices presented in practical units such as per kg where applicable.

* 🤖 **AI Farming Assistant** — planned central assistant that will allow farmers to interact with Green Flora through text chat and, later, voice interaction.

## Planned / Future Additions

* 🎙️ **Voice Interaction** — voice-based interaction with the Green Flora AI assistant, designed to support Urdu and potentially other regional languages.

* 🤖 **Integrated AI Assistant** — a central assistant capable of using Green Flora's available weather, crop, market, and farming information to answer farmer questions.

* 🌱 **Additional intelligent farming features** as the project grows.

## Tech Stack

| Layer             | Choice                                                                      |
| ----------------- | --------------------------------------------------------------------------- |
| Frontend          | Next.js (React) + Tailwind CSS, built as a PWA                              |
| Backend           | FastAPI (Python)                                                            |
| AI reasoning      | Qwen via Alibaba Model Studio API                                           |
| Disease detection | Pretrained CNN (ResNet/EfficientNet), fine-tuned for crop disease detection |
| Voice (future)    | Speech-to-Text / Text-to-Speech integration                                 |
| Weather data      | OpenWeatherMap API                                                          |
| Market price data | Pakistan AMIS / provincial market data                                      |
| Database          | Supabase PostgreSQL                                                         |
| Storage           | Supabase Storage / project storage as required                              |
| Hosting           | According to the project's deployment configuration                         |

## Project Structure

```text
green-flora/

├── frontend/          # Next.js app
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── public/
├── backend/           # FastAPI app
│   ├── routers/
│   ├── services/
│   ├── models/
│   ├── data/
│   └── db/
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

* Node.js 18+
* Python 3.10+
* Required API keys according to the current implementation

### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

### Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

### Environment Variables

Create the required `.env` files according to the current frontend/backend configuration.

**Never commit API keys, service-role keys, passwords, or other secrets to the repository.**

## Roadmap

Green Flora is being developed in focused vertical slices so that each major feature can be implemented and tested independently.

1. Weather & Agricultural Advisory
2. Crop Disease Detection
3. Market Price Trends
4. Farmer/Government Support
5. Authentication and user accounts
6. Central AI Farming Assistant
7. Urdu and regional-language voice interaction
8. Additional intelligent farming features

## Government Farmer Support

Green Flora uses official public agricultural support information rather than maintaining a directory of individual professors, agricultural experts, or private consultants.

The current farmer-support integration uses the official Punjab Agriculture Helpline information stored in Supabase.

Current service:

* **Service:** Punjab Agriculture Helpline
* **Organization:** Agriculture Department, Government of Punjab
* **Phone:** 0800-17000
* **Hours:** 8:00 AM – 8:00 PM
* **Purpose:** Agricultural support for farmers

The contact information is stored in the `government_support` Supabase table so that it can be updated without changing the frontend code.

Green Flora is not responsible for advice provided by external government services, and official contact information may change over time.

## Data Sources

| Data need                       | Source                                                          |
| ------------------------------- | --------------------------------------------------------------- |
| Weather                         | OpenWeatherMap API                                              |
| Disease detection training data | PlantVillage dataset                                            |
| Market prices                   | Pakistan AMIS / provincial market rate publications             |
| Government farmer support       | Official Punjab Government / Agriculture Department information |

## Product Direction

Green Flora is designed around a simple principle:

**Give farmers useful information first, then make it easy to ask for help.**

The application does not currently use an individual expert directory or appointment-booking system.

The future central AI assistant will bring the existing Green Flora capabilities together so farmers can ask questions naturally through text and voice instead of having to navigate through multiple separate features.

## License

TBD
