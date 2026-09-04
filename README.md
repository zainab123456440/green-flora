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

## 🛠️ Tech Stack

*   **Frontend:** Next.js, React, Tailwind CSS
*   **Backend:** Python, FastAPI
*   **Database:** Supabase (PostgreSQL for user data, market trends, and history)
*   **Image Analysis Engine:** Gemini API (Multimodal disease detection)
*   **Voice & Conversational AI:** GPT-4.6-turbo 
*   **Live Data Integrations:** AMIS (amis.pk) for automated daily market prices in Pakistan

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+
*   Python 3.10+
*   API Keys for Gemini, OpenAI (GPT-4.6-turbo), and Supabase.

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone [https://github.com/zainab123456440/green-flora.git](https://github.com/zainab123456440/green-flora.git)
   cd green-flora