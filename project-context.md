# GREEN FLORA — PROJECT CONTEXT

## 1. Project Identity

**Project Name:** Green Flora

**Project Type:** AI-powered smart agriculture platform

**Primary Target:** Pakistani farmers

**Project Stage:** Hackathon MVP / working prototype

**Development Constraint:** The project must be built with approximately zero additional budget. Existing free tiers, open-source technologies, demo data, and limited existing API credits should be prioritized.

**Development Deadline:** 7 days for the hackathon MVP.

---

# 2. Project Vision

Green Flora is a farmer-focused digital agricultural assistant designed to bring important farming information and decision support into one simple platform.

The system should help a farmer understand:

* What is happening with their farm
* What the weather is likely to do
* Whether a crop may have a disease or pest problem
* What treatment or management options may be appropriate
* What crops are selling for in the market
* What machinery is appropriate for a farming task
* Whether the farmer should buy, rent, or hire machinery
* What options fit the farmer's budget
* When a human agricultural professional should be consulted
* How to access these capabilities using voice, especially Urdu

Green Flora should not simply be an information website.

It should behave as an **AI-powered farm decision-support assistant**.

The system should combine farmer context, structured agricultural data, external information, AI reasoning, and human expert escalation to provide practical recommendations.

---

# 3. Core Problem

Farmers often need information from many different sources:

* Weather services
* Agricultural extension/professionals
* Market prices
* Crop disease information
* Fertilizer and pesticide information
* Machinery information
* Cost calculations
* Local agricultural knowledge

Green Flora aims to reduce this fragmentation.

Instead of requiring a farmer to search multiple platforms, Green Flora should provide a single farmer-friendly interface where the farmer can ask:

> "What should I do?"

and receive an answer based on their:

* Crop
* Farm size
* Location
* Crop stage
* Weather
* Disease symptoms
* Budget
* Market situation
* Machinery availability

---

# 4. Target Users

## Primary User

Pakistani farmers, particularly farmers who may prefer:

* Simple interfaces
* Urdu
* Voice interaction
* Visual information
* Practical recommendations rather than technical explanations

## Secondary Users

Potential future users include:

* Agricultural professionals
* Agronomists
* Crop disease specialists
* Agricultural machinery specialists
* Agricultural service providers
* Agricultural organizations

For the hackathon, expert profiles can use clearly identified **demo/seeded data**.

---

# 5. Main Six Features

Green Flora has six major farmer-facing capabilities.

## Feature 1 — Weather & Agricultural Weather Intelligence

The weather module should provide:

* Current temperature
* Humidity
* Rain probability
* Rainfall information
* Wind speed
* Weather forecast
* Multi-day forecast
* Weather alerts

The important part is that Green Flora should convert weather information into agricultural meaning.

Example:

Instead of only showing:

> Temperature: 32°C
> Rain probability: 80%

Green Flora should explain:

> Rain is likely tomorrow. If you are planning a pesticide spray, consider whether the expected rainfall could interfere with the treatment and check the product label or consult an expert.

Weather can also be used by other parts of the system for:

* Disease-risk reasoning
* Irrigation planning
* Spraying decisions
* Harvest planning
* Field-operation planning

Weather data is dynamic and should display appropriate timestamps/source context.

If a live weather API is unavailable during the demo, the application must have a demo fallback.

---

# 6. Feature 2 — Crop Disease Image Identification

The Crop Doctor allows a farmer to:

1. Upload a crop/leaf image
2. Send the image to an AI vision capability
3. Receive a likely disease/pest/stress identification
4. See confidence or uncertainty
5. See symptoms
6. Receive recommended next steps
7. See relevant agricultural input/treatment information
8. Estimate approximate treatment cost
9. Contact an agricultural expert when necessary

Example flow:

Farmer uploads:

> Image of diseased wheat leaf

System returns:

> Possible disease: [Disease]

Then:

* Confidence
* Observed symptoms
* Recommended management
* Relevant treatment/input options
* Estimated cost
* Warning/limitations
* "Ask an Expert" option

The system must not present uncertain AI identification as guaranteed fact.

High-risk or uncertain cases should encourage professional confirmation.

---

# 7. Feature 3 — Urdu / Regional Voice Assistant

Green Flora should provide a voice-first interaction option.

The farmer should be able to:

1. Press a microphone button
2. Speak naturally
3. Convert speech to text
4. Send the question to the Farm Assistant
5. Receive an answer
6. Optionally hear the answer using text-to-speech

Primary language:

* Urdu

Potential future languages:

* Punjabi
* Sindhi
* Other Pakistani regional languages

The first MVP should prioritize Urdu.

Example:

Farmer says:

> "Meri gandum ki fasal mein peelay dhabbe aa rahe hain. Kya karun?"

The system should understand the request and provide an appropriate response.

Voice is an **interface**, not a separate intelligence system.

The same Farm Assistant should work through:

* Text
* Voice

---

# 8. Feature 4 — Market Trends & Daily Crop Prices

The market module should provide agricultural market information.

Initial crops can include:

* Wheat
* Rice
* Maize
* Cotton
* Sugarcane
* Potato
* Tomato
* Onion

The system should support:

* Current/latest available price
* Market
* Date
* Unit
* Historical prices
* Trend visualization
* Price comparison

The system should avoid pretending that historical trends guarantee future prices.

The purpose is decision support.

Example:

> Wheat price has increased compared with the previous recorded period.

The farmer can then consider this information along with other factors.

For the hackathon MVP, seeded/curated market data is acceptable.

Live market scraping should be treated as a later enhancement unless it can be implemented reliably without jeopardizing the core application.

---

# 9. Feature 5 — Agricultural Experts & Professionals

Green Flora should provide a human escalation path.

AI should not attempt to replace agricultural professionals.

When:

* AI confidence is low
* The problem is complex
* The farmer requests a professional
* The issue may require physical inspection
* The decision is important or high-risk

the system should provide:

* Expert profile
* Specialization
* Experience
* Rating
* Contact option
* Booking option

Possible expert categories:

* Crop disease specialist
* Agronomist
* Soil specialist
* Irrigation specialist
* Agricultural machinery specialist

For the hackathon, expert profiles may be seeded demo data.

Calling can use a phone link where appropriate.

Booking can be implemented as a simple functional form that stores the booking in the database.

---

# 10. Feature 6 — AI Farm Advisor

This is the central decision-support capability.

The Farm Advisor combines:

* Farmer profile
* Farm information
* Crop
* Farm size
* Location
* Crop stage
* Weather
* Market information
* Disease analysis
* Agricultural input data
* Machinery information
* Budget

The objective is to answer practical questions.

Example:

> "I have 12 acres of wheat. I need harvesting but I only have PKR 50,000. What should I do?"

The system should consider:

* Required machinery
* Farm size
* Budget
* Purchase cost
* Rental possibility
* Hiring possibility
* Alternatives

Possible answer:

> Hiring a combine harvester may be more practical than purchasing one for this farm size and budget.

The Farm Advisor should be able to combine multiple modules rather than operating as an isolated chatbot.

---

# 11. Supporting Module — Farmer Profile

The farmer profile is the foundation of personalization.

Possible information:

* Farmer name
* Phone number
* Preferred language
* Farm location
* Farm area
* Fields
* Crops
* Crop stage
* Irrigation information
* Machinery owned/accessible
* Budget information where appropriate

For the hackathon, use a seeded demo farmer.

Example:

**Name:** Muhammad Asif

**Farm:** 12 acres

**Crop:** Wheat

**Location:** Punjab, Pakistan

The profile should be editable.

---

# 12. Supporting Module — Farm & Field Map

Green Flora should include an interactive farm map.

The map can show:

* Farmer location
* Farm location
* Field boundaries where available
* Field name
* Crop
* Area
* Crop stage

The map should eventually provide geographic context for:

* Weather
* Farm records
* Crop health
* Field-level recommendations

Use open-source/free mapping technology for the MVP where possible.

---

# 13. Supporting Module — Agricultural Inputs

Green Flora should maintain structured agricultural input information.

Potential categories:

* Fertilizers
* Herbicides
* Fungicides
* Insecticides
* Other crop-management products

Useful fields include:

* Category
* Local problem/target
* Scientific target/action
* Product/brand
* Company
* Formulation
* Active ingredient
* Dosage per acre
* Approximate price
* Crop
* Target disease/pest/problem

The project has an agricultural dataset containing approximately 48 major agricultural products for the initial knowledge layer.

The AI should retrieve relevant structured information rather than inventing product details.

---

# 14. Supporting Module — Budget & Cost Intelligence

Green Flora should be budget-aware.

The farmer should not receive a recommendation without considering affordability when budget information is relevant.

The system can compare:

* Product cost
* Estimated treatment cost
* Machinery purchase cost
* Machinery rental cost
* Machinery hiring/service cost
* Farm operation cost

A central concept is:

## Buy vs Rent vs Hire

Example:

Farmer:

> 12 acres wheat, harvesting required, budget PKR 50,000.

Green Flora:

> Purchase: Not recommended
> Rental: Possible
> Hiring: Recommended

The system should favor practical and economical options.

---

# 15. Supporting Module — Mechanization

Mechanization should be an AI decision-support module, not simply a machinery catalogue.

Important machinery categories include:

## Land Preparation

* Tractor
* Plough
* Cultivator
* Disc plough
* Disc harrow
* Rotavator

## Planting / Sowing

* Seed drill
* Zero-till drill
* Planter
* Rice transplanter

## Crop Care

* Boom sprayer
* Power sprayer
* Fertilizer spreader
* Mechanical weeder

## Irrigation

* Water pump
* Solar pump
* Drip irrigation equipment
* Sprinkler equipment

## Harvesting

* Reaper
* Combine harvester
* Crop-specific harvesters

## Post-Harvest

* Thresher
* Sheller
* Cleaner
* Dryer

## Transport

* Tractor trolley
* Trailer

## Precision Agriculture

Future:

* GPS guidance
* Sensors
* Drones
* Precision machinery

The system should consider:

* Crop
* Farm size
* Task
* Budget
* Availability
* Buy/rent/hire options

---

# 16. Dashboard

The dashboard is the main entry point.

It should show a concise overview of the farmer's farm.

Possible dashboard sections:

* Greeting
* Farm name/location
* Total acreage
* Current crops
* Weather summary
* Weather alert
* Market summary
* Crop health status
* Upcoming farm tasks
* Farm map
* Quick AI Assistant
* Voice button
* Quick actions

Example quick actions:

* Check Weather
* Diagnose Crop
* Check Market
* Ask Green Flora
* Find Machinery
* Talk to Expert

The dashboard should be visually polished but not overloaded.

---

# 17. Proposed Application Pages

The MVP should use a multi-page structure.

Suggested routes:

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

The navigation should remain consistent across pages.

The application must be responsive, especially for mobile devices.

---

# 18. AI Architecture

Green Flora should be designed as a modular agentic system.

Conceptually:

```text
Farmer
   |
   v
Farm Assistant
   |
   +---- Weather Agent
   |
   +---- Market Agent
   |
   +---- Crop Health Agent
   |
   +---- Input/Treatment Agent
   |
   +---- Mechanization Agent
   |
   +---- Budget Agent
   |
   +---- Expert/Escalation Agent
```

These do not need to be separate deployed applications.

They can be Python modules/services inside one FastAPI backend.

The Farm Assistant acts as the coordinator.

---

# 19. Farm Assistant Behavior

The Farm Assistant should:

1. Understand farmer intent
2. Retrieve relevant farm context
3. Determine which capability is required
4. Call the appropriate service/agent
5. Retrieve relevant data
6. Reason over the information
7. Produce a concise farmer-friendly response
8. Explain important assumptions
9. Escalate to a professional when necessary

Example:

Farmer asks:

> "Should I spray my wheat today?"

The assistant can consider:

```text
Farmer
+
Wheat
+
Farm location
+
Weather
+
Crop stage
+
Treatment context
```

and produce a practical response.

---

# 20. Technology Stack

## Frontend

Use:

* Next.js
* React
* TypeScript
* Tailwind CSS
* Recharts
* Leaflet/OpenStreetMap where appropriate

## Backend

Use:

* Python
* FastAPI
* Pydantic

## Database

Use:

* Supabase
* PostgreSQL

## AI

Primary development/application AI should prioritize available free tiers.

Potential AI services:

* Gemini
* Existing OpenAI credits as backup

The approximately $4 existing OpenAI credit should not be consumed unnecessarily during development.

## Voice

Initially prefer browser-native/free speech capabilities.

Avoid paid voice infrastructure unless it is available at no cost.

## Deployment

Use free-tier hosting where possible.

The project must not depend on paid infrastructure for the hackathon MVP.

---

# 21. Zero-Budget Development Strategy

The project has essentially no additional budget.

Therefore:

* Prefer open-source libraries
* Prefer free API tiers
* Prefer seeded demo data
* Prefer browser-native capabilities
* Avoid unnecessary paid APIs
* Avoid paid subscriptions
* Avoid paid infrastructure
* Keep external API usage low
* Build fallback functionality

Existing OpenAI credits should be treated as a limited backup resource.

---

# 22. Demo Mode

Green Flora must support a reliable demo mode.

Example:

```text
DEMO_MODE=true
```

When a live service fails or is unavailable, the application should gracefully use appropriate demo/seeded information where possible.

Possible demo fallbacks:

* Demo farmer
* Demo farm
* Demo market prices
* Demo weather
* Demo disease results
* Demo machinery
* Demo experts

The fallback should preserve the user experience.

The application must never crash simply because an external API is unavailable.

---

# 23. Demo Farmer

A seeded farmer can be used for the hackathon demonstration.

Example:

```text
Name:
Muhammad Asif

Farm:
12 acres

Crop:
Wheat

Location:
Punjab, Pakistan

Budget:
PKR 150,000
```

This data is for demonstration purposes.

The application should make it obvious that seeded expert profiles, prices, or other demo-only information are prototype data where appropriate.

---

# 24. Ideal Hackathon Demonstration

The final demo should tell one connected story.

## Step 1 — Dashboard

Open Green Flora.

Show:

* Farmer
* Farm
* Wheat
* 12 acres
* Weather
* Market
* Farm map

## Step 2 — Weather

Show weather forecast.

Explain how the weather affects a farming operation.

## Step 3 — Disease

Upload a crop image.

Show:

* Possible disease
* Confidence
* Symptoms
* Recommended action
* Estimated cost

## Step 4 — Budget

Show how the recommendation changes according to the farmer's budget.

## Step 5 — Market

Show wheat market price/trend.

## Step 6 — Mechanization

Ask:

> "I need to harvest 12 acres but I cannot afford to buy a combine."

Green Flora recommends:

> Hire/rent rather than purchase.

## Step 7 — Voice

Ask in Urdu:

> "Meri fasal ke liye abhi kya karna chahiye?"

The Farm Assistant responds using farm context.

## Step 8 — Expert

If the disease result is uncertain:

> "Would you like to speak with a crop specialist?"

Click:

> Call Expert / Book Consultation

This demonstrates that Green Flora connects AI with human expertise.

---

# 25. Seven-Day MVP Priority

Because development time is only seven days, priorities are:

## Day 1

Foundation:

* Project structure
* Frontend setup
* Backend setup
* Supabase setup
* Context files
* Basic navigation
* Dashboard skeleton

## Day 2

Farm:

* Farmer profile
* Farm data
* Field data
* Map
* Weather

## Day 3

Market:

* Market database
* Prices
* Trends
* Charts
* Farm costs

## Day 4

Crop Doctor:

* Image upload
* AI image analysis
* Disease result
* Treatment recommendation
* Cost
* Demo fallback

## Day 5

Farm Assistant:

* AI integration
* Intent handling
* Farm context
* Weather/market/disease connections

## Day 6

Final capabilities:

* Voice
* Mechanization
* Experts
* Booking/calling
* Integration

## Day 7

Do not add major new functionality.

Focus on:

* Bug fixing
* API testing
* Error handling
* Demo fallback
* UI polish
* Mobile responsiveness
* Deployment
* Demo preparation

---

# 26. MVP Scope Rules

The following are NOT priorities for the seven-day MVP:

* Nationwide production deployment
* Hundreds of real experts
* Real payment processing
* Complete agricultural coverage
* Perfect disease detection
* Training a custom large AI model
* Hundreds of machinery types
* Complex authentication
* Advanced satellite analytics
* Full production marketplace
* Perfect live market scraping
* Complex microservice infrastructure

These can be future features.

The MVP should demonstrate the concept convincingly.

---

# 27. Development Principles

The application should be:

* Modular
* Maintainable
* Responsive
* Simple for farmers
* API-driven
* Database-backed
* AI-assisted
* Failure-tolerant
* Demo-safe

Do not introduce unnecessary complexity.

Do not create separate microservices unless there is a strong reason.

Do not add a new library when an existing dependency can solve the problem.

Do not replace working functionality unnecessarily.

---

# 28. AI Coding Rules

Any AI coding assistant working on this repository must:

1. Read the project context before implementing significant functionality.
2. Inspect existing files before modifying them.
3. Preserve existing working functionality.
4. Avoid duplicate components.
5. Avoid duplicate API endpoints.
6. Follow the existing architecture.
7. Follow the database schema.
8. Follow the API contract.
9. Never hardcode API keys.
10. Use environment variables for secrets.
11. Do not modify unrelated files.
12. Explain significant architectural changes.
13. Keep implementation simple enough for the seven-day MVP.
14. Prefer reusable components.
15. Add error handling for external APIs.
16. Preserve demo fallback behavior.
17. Avoid unnecessary dependencies.
18. Test changes before moving to another feature.
19. Update documentation when architecture changes.
20. Never claim that an implementation works without testing it.

---

# 29. Source of Truth

The Green Flora repository is the source of truth for the project.

Important project documents:

```text
PROJECT_CONTEXT.md
ARCHITECTURE.md
DATABASE_SCHEMA.md
API_CONTRACT.md
DEVELOPMENT_RULES.md
CURRENT_STATUS.md
```

AI tools should use these files to understand the project.

If a previous conversation conflicts with the repository documentation, the current repository state and documented decisions should be treated as authoritative unless explicitly changed by the project owner.

---

# 30. Current Development Philosophy

Green Flora is being built as a **hackathon MVP**, not a production agricultural platform.

The objective is to demonstrate:

> AI + agricultural data + farmer context + multimodal interaction + practical recommendations + human expert escalation.

The system should feel like one coherent product.

Features should not feel like disconnected mini-projects.

The farmer should be able to move naturally from:

```text
Weather
   ↓
Crop Health
   ↓
Treatment
   ↓
Cost
   ↓
Market
   ↓
Machinery
   ↓
Expert
```

and the Farm Assistant should understand the shared context.

---

# 31. Core Product Principle

Green Flora should answer the question:

> **"Given my farm situation, what should I do next?"**

rather than simply:

> "Here is some agricultural information."

The system should prioritize:

* Context
* Practicality
* Affordability
* Simplicity
* Transparency
* Human escalation

---

# 32. Final Product Definition

**Green Flora is an AI-powered smart agriculture platform for Pakistani farmers that combines weather intelligence, crop disease image analysis, market trends, Urdu/regional voice interaction, agricultural expert access, farm mechanization guidance, cost and budget intelligence, farm mapping, and personalized AI recommendations in one farmer-friendly platform.**

The ultimate goal is to make agricultural decision-making more accessible, understandable, affordable, and actionable for farmers.

---

# END OF PROJECT CONTEXT
