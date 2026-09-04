# Feature Modules

<cite>
**Referenced Files in This Document**
- [page.tsx](file://Frontend/greenflora/app/dashboard/page.tsx)
- [page.tsx](file://Frontend/greenflora/app/crop-doctor/page.tsx)
- [page.tsx](file://Frontend/greenflora/app/market/page.tsx)
- [page.tsx](file://Frontend/greenflora/app/weather/page.tsx)
- [page.tsx](file://Frontend/greenflora/app/my-farm/page.tsx)
- [useFarmer.ts](file://Frontend/greenflora/Hooks/useFarmer.ts)
- [useFields.ts](file://Frontend/greenflora/Hooks/useFields.ts)
- [useWeather.ts](file://Frontend/greenflora/Hooks/useWeather.ts)
- [useMarket.ts](file://Frontend/greenflora/Hooks/useMarket.ts)
- [MarketAPI.ts](file://Frontend/greenflora/services/MarketAPI.ts)
- [CropDoctorAPI.ts](file://Frontend/greenflora/services/CropDoctorAPI.ts)
- [WeatherAPI.ts](file://Frontend/greenflora/services/WeatherAPI.ts)
- [FarmingInsights.tsx](file://Frontend/greenflora/components/dashboard/FarmingInsights.tsx)
- [MarketSummaryCards.tsx](file://Frontend/greenflora/components/market/MarketSummaryCards.tsx)
- [CurrentWeatherHero.tsx](file://Frontend/greenflora/components/weather/CurrentWeatherHero.tsx)
</cite>

## Table of Contents
1. Introduction
2. Project Structure
3. Core Components
4. Architecture Overview
5. Detailed Component Analysis
6. Dependency Analysis
7. Performance Considerations
8. Troubleshooting Guide
9. Conclusion

## Introduction
This document explains the Green-Flora feature modules with a page-based architecture: each major feature is a dedicated Next.js page that owns its data fetching, state management, and UI composition. The features covered are Dashboard, Crop Doctor, Market Analysis, Weather Information, and Farm Management. For each page, we describe the feature-specific hooks, API integrations, business logic, data flow from backend services to UI components, and user experience patterns such as loading states, error handling, and empty states.

## Project Structure
Green-Flora’s frontend follows a feature-oriented layout under app/<feature>/page.tsx. Each page composes reusable UI components and consumes domain-specific React hooks that encapsulate data fetching and mutation logic. Services layer abstracts HTTP calls to backend endpoints or third-party APIs.

```mermaid
graph TB
subgraph "Pages"
D["Dashboard Page"]
C["Crop Doctor Page"]
M["Market Page"]
W["Weather Page"]
F["My Farm Page"]
end
subgraph "Hooks"
HF["useFarmer"]
HFi["useFields"]
HW["useWeather"]
HM["useMarketCommodities / useMarketOverview"]
end
subgraph "Services"
SA["MarketAPI"]
SC["CropDoctorAPI"]
SW["WeatherAPI"]
end
D --> HF
D --> HFi
D --> HW
D --> HM
C --> SC
M --> HM
M --> SA
W --> HW
W --> SW
F --> HFi
F --> HF
```

**Diagram sources**
- [page.tsx](file://Frontend/greenflora/app/dashboard/page.tsx)
- [page.tsx](file://Frontend/greenflora/app/crop-doctor/page.tsx)
- [page.tsx](file://Frontend/greenflora/app/market/page.tsx)
- [page.tsx](file://Frontend/greenflora/app/weather/page.tsx)
- [page.tsx](file://Frontend/greenflora/app/my-farm/page.tsx)
- [useFarmer.ts](file://Frontend/greenflora/Hooks/useFarmer.ts)
- [useFields.ts](file://Frontend/greenflora/Hooks/useFields.ts)
- [useWeather.ts](file://Frontend/greenflora/Hooks/useWeather.ts)
- [useMarket.ts](file://Frontend/greenflora/Hooks/useMarket.ts)
- [MarketAPI.ts](file://Frontend/greenflora/services/MarketAPI.ts)
- [CropDoctorAPI.ts](file://Frontend/greenflora/services/CropDoctorAPI.ts)
- [WeatherAPI.ts](file://Frontend/greenflora/services/WeatherAPI.ts)

**Section sources**
- [page.tsx](file://Frontend/greenflora/app/dashboard/page.tsx)
- [page.tsx](file://Frontend/greenflora/app/crop-doctor/page.tsx)
- [page.tsx](file://Frontend/greenflora/app/market/page.tsx)
- [page.tsx](file://Frontend/greenflora/app/weather/page.tsx)
- [page.tsx](file://Frontend/greenflora/app/my-farm/page.tsx)

## Core Components
- Dashboard aggregates farmer profile, farm summary, AI greeting, weather, and market highlights into a single overview. It composes insight cards and links to deeper pages for details.
- Crop Doctor orchestrates image upload, analysis request, and result presentation (diagnosis and recommendations).
- Market displays AMIS wholesale price intelligence with commodity selection, market filtering, trend charts, comparisons, distributions, and insights.
- Weather resolves location (farmer profile or device), fetches current conditions, hourly/daily forecasts, and soil metrics, then renders hero and detail sections.
- My Farm manages farm location onboarding, field CRUD, crop cycles, and visualizations.

Key responsibilities:
- Data ownership lives in hooks; pages remain thin controllers.
- Services centralize HTTP requests, timeouts, and error classification.
- UI components focus on rendering and user interactions.

**Section sources**
- [page.tsx](file://Frontend/greenflora/app/dashboard/page.tsx)
- [page.tsx](file://Frontend/greenflora/app/crop-doctor/page.tsx)
- [page.tsx](file://Frontend/greenflora/app/market/page.tsx)
- [page.tsx](file://Frontend/greenflora/app/weather/page.tsx)
- [page.tsx](file://Frontend/greenflora/app/my-farm/page.tsx)

## Architecture Overview
The application uses a layered approach:
- Pages: route-level containers that compose UI and orchestrate hook usage.
- Hooks: encapsulate data fetching, caching via local state, mutations, and refresh actions.
- Services: HTTP clients with timeouts, auth header injection, and typed errors.
- Components: presentational and feature-specific UI building blocks.

```mermaid
sequenceDiagram
participant P as "Page"
participant H as "Hook"
participant S as "Service"
participant B as "Backend / External API"
P->>H : mount / params change
H->>S : request(data)
S->>B : HTTP call
B-->>S : response or error
S-->>H : data or typed error
H-->>P : loading -> success/error state
P->>P : render UI with skeletons / content / errors
```

**Diagram sources**
- [useWeather.ts](file://Frontend/greenflora/Hooks/useWeather.ts)
- [WeatherAPI.ts](file://Frontend/greenflora/services/WeatherAPI.ts)
- [useMarket.ts](file://Frontend/greenflora/Hooks/useMarket.ts)
- [MarketAPI.ts](file://Frontend/greenflora/services/MarketAPI.ts)
- [CropDoctorAPI.ts](file://Frontend/greenflora/services/CropDoctorAPI.ts)

## Detailed Component Analysis

### Dashboard
- Purpose: Central overview combining AI greeting, Today’s Insight (weather, crops, market), assistant panel, farm snapshot, and government support.
- Data flow:
  - Farmer profile via useFarmer.
  - Farm summary via useFields.
  - Weather via useWeather using farm coordinates when available.
  - Market commodities via useMarketCommodities; default commodity selected based on active crops.
- UX patterns:
  - Skeleton placeholders while loading.
  - ErrorState with retry.
  - EmptyState when no farmer profile exists.
  - Language switcher integration.

```mermaid
flowchart TD
Start(["Dashboard Mount"]) --> LoadFarmer["useFarmer()"]
LoadFarmer --> LoadFields["useFields()"]
LoadFields --> HasLoc{"Farm coords?"}
HasLoc -- Yes --> LoadWeather["useWeather(lat, lng)"]
HasLoc -- No --> SkipWeather["No weather yet"]
LoadFields --> LoadMarket["useMarketCommodities()"]
LoadMarket --> PickDefault["pickDefaultCommodity()"]
LoadWeather --> Compose["Compose insights + stats"]
SkipWeather --> Compose
PickDefault --> Compose
Compose --> Render["Render dashboard UI"]
```

**Diagram sources**
- [page.tsx](file://Frontend/greenflora/app/dashboard/page.tsx)
- [useFarmer.ts](file://Frontend/greenflora/Hooks/useFarmer.ts)
- [useFields.ts](file://Frontend/greenflora/Hooks/useFields.ts)
- [useWeather.ts](file://Frontend/greenflora/Hooks/useWeather.ts)
- [useMarket.ts](file://Frontend/greenflora/Hooks/useMarket.ts)

**Section sources**
- [page.tsx](file://Frontend/greenflora/app/dashboard/page.tsx)
- [useFarmer.ts](file://Frontend/greenflora/Hooks/useFarmer.ts)
- [useFields.ts](file://Frontend/greenflora/Hooks/useFields.ts)
- [useWeather.ts](file://Frontend/greenflora/Hooks/useWeather.ts)
- [useMarket.ts](file://Frontend/greenflora/Hooks/useMarket.ts)
- [FarmingInsights.tsx](file://Frontend/greenflora/components/dashboard/FarmingInsights.tsx)

### Crop Doctor
- Purpose: Upload an image of a crop and receive AI-powered diagnosis and recommendations.
- Data flow:
  - ImageUploader captures file and preview.
  - analyseCropImage sends multipart form to backend.
  - Result displayed via DiagnosisCard and RecommendationsCard.
- UX patterns:
  - Idle, analyzing, success, and error states.
  - Retry behavior on failure.
  - Clear/reset to start over.

```mermaid
sequenceDiagram
participant U as "User"
participant P as "Crop Doctor Page"
participant S as "CropDoctorAPI"
participant B as "Backend Gemini Service"
U->>P : Select image
P->>P : Set preview & idle state
U->>P : Click Analyse
P->>S : analyseCropImage(file)
S->>B : POST /api/crop-doctor/analyse (multipart)
B-->>S : JSON diagnosis + recommendations
S-->>P : Success or typed error
P->>P : Render DiagnosisCard / RecommendationsCard or ErrorState
```

**Diagram sources**
- [page.tsx](file://Frontend/greenflora/app/crop-doctor/page.tsx)
- [CropDoctorAPI.ts](file://Frontend/greenflora/services/CropDoctorAPI.ts)

**Section sources**
- [page.tsx](file://Frontend/greenflora/app/crop-doctor/page.tsx)
- [CropDoctorAPI.ts](file://Frontend/greenflora/services/CropDoctorAPI.ts)

### Market Analysis
- Purpose: Show AMIS wholesale price intelligence per crop and market filter.
- Data flow:
  - useMarketCommodities loads available crops and data availability flag.
  - Default commodity selected based on active farm crops.
  - useMarketOverview fetches overview for selected crop and optional market filter.
  - MarketSummaryCards and charts render derived metrics.
- UX patterns:
  - Skeletons during load.
  - EmptyState when no AMIS data yet.
  - ErrorState with retry.
  - Filter bar resets market when crop changes.

```mermaid
sequenceDiagram
participant P as "Market Page"
participant HC as "useMarketCommodities"
participant HO as "useMarketOverview"
participant MA as "MarketAPI"
participant B as "Backend / AMIS"
P->>HC : load commodities
HC->>MA : GET /api/market/commodities
MA->>B : fetch commodities
B-->>MA : {commodities, data_available}
MA-->>HC : result
P->>HO : load overview(commodityId, marketId)
HO->>MA : GET /api/market/overview?days=180&market_id?
MA->>B : fetch overview
B-->>MA : overview
MA-->>HO : overview
HO-->>P : overview
P->>P : render summary cards, charts, insights
```

**Diagram sources**
- [page.tsx](file://Frontend/greenflora/app/market/page.tsx)
- [useMarket.ts](file://Frontend/greenflora/Hooks/useMarket.ts)
- [MarketAPI.ts](file://Frontend/greenflora/services/MarketAPI.ts)

**Section sources**
- [page.tsx](file://Frontend/greenflora/app/market/page.tsx)
- [useMarket.ts](file://Frontend/greenflora/Hooks/useMarket.ts)
- [MarketAPI.ts](file://Frontend/greenflora/services/MarketAPI.ts)
- [MarketSummaryCards.tsx](file://Frontend/greenflora/components/market/MarketSummaryCards.tsx)

### Weather Information
- Purpose: Provide current conditions, hourly/daily forecasts, and soil metrics for the farmer’s area.
- Data flow:
  - Location resolution: farmer profile coordinates first, then device geolocation if needed.
  - Reverse geocoding to resolve readable location name.
  - Fetch weather bundle from Open-Meteo including current, hourly, daily, and soil data.
- UX patterns:
  - Loading indicators for location resolution and weather fetch.
  - EmptyState prompting to set or share location.
  - ErrorState with retry on weather fetch failures.
  - Hero section shows resolved location source and date.

```mermaid
sequenceDiagram
participant P as "Weather Page"
participant L as "useLocation"
participant W as "useWeather"
participant WA as "WeatherAPI"
participant OM as "Open-Meteo"
participant OS as "Nominatim"
P->>L : resolve(farmer coords, fallback)
L->>OS : reverseGeocode(lat, lon)
OS-->>L : locationName
L-->>P : latitude, longitude, locationName
P->>W : fetch(latitude, longitude)
W->>WA : fetchWeatherData(lat, lon)
WA->>OM : GET forecast (current, hourly, daily, soil)
OM-->>WA : weather bundle
WA-->>W : parsed WeatherData
W-->>P : data
P->>P : render hero, details, forecasts, soil
```

**Diagram sources**
- [page.tsx](file://Frontend/greenflora/app/weather/page.tsx)
- [useWeather.ts](file://Frontend/greenflora/Hooks/useWeather.ts)
- [WeatherAPI.ts](file://Frontend/greenflora/services/WeatherAPI.ts)
- [CurrentWeatherHero.tsx](file://Frontend/greenflora/components/weather/CurrentWeatherHero.tsx)

**Section sources**
- [page.tsx](file://Frontend/greenflora/app/weather/page.tsx)
- [useWeather.ts](file://Frontend/greenflora/Hooks/useWeather.ts)
- [WeatherAPI.ts](file://Frontend/greenflora/services/WeatherAPI.ts)
- [CurrentWeatherHero.tsx](file://Frontend/greenflora/components/weather/CurrentWeatherHero.tsx)

### Farm Management (My Farm)
- Purpose: Onboard farm location, manage fields and crop cycles, visualize farm land and map.
- Data flow:
  - useFields provides farm summary and CRUD actions for fields and crop cycles.
  - useFarmer provides farmer profile updates (e.g., saving coordinates).
  - Two-stage UX: Stage 1 picks location on interactive map; Stage 2 shows static farm canvas and list/detail panels.
- UX patterns:
  - Toast messages for success/error feedback.
  - Mode-driven rendering (view, set-location, add/edit field, add/edit cycle).
  - EmptyState when no farm data exists.
  - Confirmation dialogs for destructive actions.

```mermaid
flowchart TD
Start(["My Farm Mount"]) --> Load["useFields() + useFarmer()"]
Load --> Loc{"Has location?"}
Loc -- No --> Stage1["Show location picker (map)"]
Stage1 --> SaveLoc["saveUpdate({lat, lng})"]
SaveLoc --> Stage2["Stage 2: Farm view"]
Loc -- Yes --> Stage2
Stage2 --> Manage["Field & crop cycle CRUD"]
Manage --> Refresh["refresh() after mutations"]
Refresh --> Stage2
```

**Diagram sources**
- [page.tsx](file://Frontend/greenflora/app/my-farm/page.tsx)
- [useFields.ts](file://Frontend/greenflora/Hooks/useFields.ts)
- [useFarmer.ts](file://Frontend/greenflora/Hooks/useFarmer.ts)

**Section sources**
- [page.tsx](file://Frontend/greenflora/app/my-farm/page.tsx)
- [useFields.ts](file://Frontend/greenflora/Hooks/useFields.ts)
- [useFarmer.ts](file://Frontend/greenflora/Hooks/useFarmer.ts)

## Dependency Analysis
- Pages depend on hooks for data and actions.
- Hooks depend on services for network calls.
- Services encapsulate HTTP concerns: base URL, timeouts, auth headers, error classification.
- Components consume typed data from hooks/pages and render UI.

```mermaid
graph LR
Dashboard["Dashboard Page"] --> useFarmer["useFarmer"]
Dashboard --> useFields["useFields"]
Dashboard --> useWeather["useWeather"]
Dashboard --> useMarket["useMarket"]
CropDoctor["Crop Doctor Page"] --> CropAPI["CropDoctorAPI"]
Market["Market Page"] --> useMarket
Market --> MarketAPI["MarketAPI"]
Weather["Weather Page"] --> useWeather
Weather --> WeatherAPI["WeatherAPI"]
MyFarm["My Farm Page"] --> useFields
MyFarm --> useFarmer
```

**Diagram sources**
- [page.tsx](file://Frontend/greenflora/app/dashboard/page.tsx)
- [page.tsx](file://Frontend/greenflora/app/crop-doctor/page.tsx)
- [page.tsx](file://Frontend/greenflora/app/market/page.tsx)
- [page.tsx](file://Frontend/greenflora/app/weather/page.tsx)
- [page.tsx](file://Frontend/greenflora/app/my-farm/page.tsx)
- [useFarmer.ts](file://Frontend/greenflora/Hooks/useFarmer.ts)
- [useFields.ts](file://Frontend/greenflora/Hooks/useFields.ts)
- [useWeather.ts](file://Frontend/greenflora/Hooks/useWeather.ts)
- [useMarket.ts](file://Frontend/greenflora/Hooks/useMarket.ts)
- [MarketAPI.ts](file://Frontend/greenflora/services/MarketAPI.ts)
- [CropDoctorAPI.ts](file://Frontend/greenflora/services/CropDoctorAPI.ts)
- [WeatherAPI.ts](file://Frontend/greenflora/services/WeatherAPI.ts)

**Section sources**
- [useFarmer.ts](file://Frontend/greenflora/Hooks/useFarmer.ts)
- [useFields.ts](file://Frontend/greenflora/Hooks/useFields.ts)
- [useWeather.ts](file://Frontend/greenflora/Hooks/useWeather.ts)
- [useMarket.ts](file://Frontend/greenflora/Hooks/useMarket.ts)
- [MarketAPI.ts](file://Frontend/greenflora/services/MarketAPI.ts)
- [CropDoctorAPI.ts](file://Frontend/greenflora/services/CropDoctorAPI.ts)
- [WeatherAPI.ts](file://Frontend/greenflora/services/WeatherAPI.ts)

## Performance Considerations
- Request timeouts:
  - Market and Crop Doctor services define explicit timeouts to avoid hanging UI.
  - Weather service sets timeouts for both weather and reverse geocoding calls.
- Efficient data fetching:
  - Weather service bundles current, hourly, daily, and soil data in one request to minimize round-trips.
  - Market overview fetches a wide window (180 days) and slices periods client-side for instant switching.
- State coalescing:
  - useMarketOverview guards against out-of-order responses using request IDs to prevent stale data display.
- UI responsiveness:
  - Skeleton loaders provide perceived performance during data fetches.
  - Conditional rendering avoids unnecessary computations until data is available.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and recovery patterns:
- Network or timeout errors:
  - Services classify errors (network, timeout, validation, server) and expose user-friendly messages.
  - Pages offer retry actions via ErrorState.
- Missing data:
  - Market page shows EmptyState when AMIS data is not yet available.
  - Weather page prompts to set or share location when coordinates are missing.
- Authentication:
  - Services inject Authorization headers when tokens exist; ensure login flows persist tokens correctly.
- Mutations:
  - Field and farmer mutations wrap operations with loading flags and refresh local state on success.

**Section sources**
- [MarketAPI.ts](file://Frontend/greenflora/services/MarketAPI.ts)
- [CropDoctorAPI.ts](file://Frontend/greenflora/services/CropDoctorAPI.ts)
- [WeatherAPI.ts](file://Frontend/greenflora/services/WeatherAPI.ts)
- [useFields.ts](file://Frontend/greenflora/Hooks/useFields.ts)
- [useFarmer.ts](file://Frontend/greenflora/Hooks/useFarmer.ts)
- [page.tsx](file://Frontend/greenflora/app/market/page.tsx)
- [page.tsx](file://Frontend/greenflora/app/weather/page.tsx)

## Conclusion
Green-Flora’s feature modules follow a clear page-based architecture where each feature owns its data lifecycle through dedicated hooks and services. This separation yields maintainable code, consistent UX patterns (loading, error, empty states), and robust error handling. The design enables scalable additions of new features while keeping data flows predictable and testable.

[No sources needed since this section summarizes without analyzing specific files]