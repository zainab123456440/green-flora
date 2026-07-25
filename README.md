# Green Flora 🌱

**An AI-powered farming companion**

Green Flora helps farmers make smarter, faster, and more profitable decisions by combining
location-based weather forecasting, deep learning-based crop disease detection, an expert
directory with direct call/booking, live market price trends, and Urdu voice interaction —
all in one connected platform.

## Features

- 🌦️ **Weather & Irrigation Advisory** — location-based forecasts with AI-generated
  irrigation/fertilization suggestions
- 🌿 **Crop Disease Detection** — upload a photo, get an instant diagnosis via a
  fine-tuned CNN
- 👨‍🌾 **Expert Directory** — browse agricultural experts and book/call them directly
- 📈 **Market Price Trends** — track crop prices over time with a built-in profit
  calculator
- 🎙️ **Urdu Voice Interaction** — speak and listen to the app in Urdu

### Planned / future additions

- User accounts (save farms, history, favorites)
- Additional features TBD as the project grows

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (React) + Tailwind CSS, built as a PWA |
| Backend | FastAPI (Python) |
| AI reasoning | Qwen via Alibaba Model Studio API |
| Disease detection | Pretrained CNN (ResNet/EfficientNet) fine-tuned on PlantVillage, deployed on Alibaba PAI-EAS |
| Voice (STT/TTS) | Browser Web Speech API → Deepgram (STT) + ElevenLabs (TTS) |
| Weather data | OpenWeatherMap API |
| Market price data | Pakistan AMIS / provincial data |
| Database | PostgreSQL (or SQLite for local dev) |
| Storage | Alibaba OSS |
| Hosting | Alibaba Cloud ECS + API Gateway |

## Project Structure

```
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

- Node.js 18+
- Python 3.10+
- API keys: OpenWeatherMap, Alibaba Cloud (Model Studio, PAI-EAS, OSS)

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

### Environment variables

Create a `.env` file inside `backend/` (never commit this) with:

```
OPENWEATHER_API_KEY=
ALIBABA_MODEL_STUDIO_KEY=
ALIBABA_OSS_KEY=
ALIBABA_OSS_SECRET=
DATABASE_URL=
```

## Roadmap

Built in vertical slices — one full feature at a time, frontend and backend together,
so there's always something working end-to-end:

1. Weather & Advisory
2. Disease Detection
3. Expert Directory
4. Market Trends
5. Urdu Voice Layer
6. Auth / user accounts
7. Additional features

## Data Sources

| Data need | Source |
|---|---|
| Weather | OpenWeatherMap API |
| Disease detection training data | PlantVillage dataset (Kaggle) |
| Market prices | Pakistan AMIS / provincial mandi rate publications |
| Expert profiles | Seeded initially, real onboarding as a next step |

## License

TBD
