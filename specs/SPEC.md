# Daily — App Specification

> Smart personal assistant app (Hebrew). MVP vertical: **Reminders & Voice**.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React Native + Expo | SDK 54 / RN 0.81 |
| Backend | Node.js + Express + TypeScript (ESM) | Node 22 / Express 4 |
| Database | PostgreSQL | 15 (Docker) |
| ORM | Prisma | 6.19 |
| AI — Speech-to-Text | Groq Whisper | whisper-large-v3 |
| AI — Intent Parsing | Groq LLM | qwen/qwen3.8-27b |
| Notifications | expo-notifications | Local scheduled |
| Audio Recording | expo-av | ~15.0.0 |
| Dev Runner | tsx (hot-reload) | 4.x |
| Package Manager | npm | — |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  Mobile App (Expo Go / iOS / Android / Web)     │
│  ┌───────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ Dashboard │  │ Voice    │  │ Notification│  │
│  │ Screen    │  │ Controls │  │ Service     │  │
│  └─────┬─────┘  └────┬─────┘  └──────┬──────┘  │
│        │              │               │          │
│        ▼              ▼               ▼          │
│  ┌─────────────────────────────────────────┐    │
│  │         API Layer (fetch)               │    │
│  │  reminderApi.ts  │  voiceApi.ts         │    │
│  └──────────────────┼──────────────────────┘    │
└─────────────────────┼───────────────────────────┘
                      │ HTTP
┌─────────────────────┼───────────────────────────┐
│  Backend (Express)  │  Port 3000                 │
│  ┌──────────────────┼──────────────────────┐    │
│  │  Routes: /api/reminders, /api/voice     │    │
│  └──────────────────┼──────────────────────┘    │
│        │              │                          │
│        ▼              ▼                          │
│  ┌───────────┐  ┌──────────────────────┐        │
│  │ Reminder  │  │ Voice Controller     │        │
│  │ Controller│  │ Whisper → LLM → DB   │        │
│  └─────┬─────┘  └──────────┬───────────┘        │
│        │                    │                    │
│        ▼                    ▼                    │
│  ┌──────────────────────────────────────┐       │
│  │  Prisma ORM → PostgreSQL (Docker)    │       │
│  └──────────────────────────────────────┘       │
└──────────────────────────────────────────────────┘
```

---

## Database Schema

### User
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | Auto-generated |
| email | String | Unique |
| firstName | String | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### Reminder
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | Auto-generated |
| userId | UUID (FK → User) | |
| title | String | Hebrew text |
| description | String? | Optional |
| scheduledTime | DateTime | ISO-8601 with timezone |
| phoneNumber | String? | For quick-dial action |
| websiteUrl | String? | For quick-link action |
| status | String | Default: "pending" |
| isProactive | Boolean | Default: false |
| notificationOffsetMinutes | Int? | Default: 0 |
| createdAt | DateTime | |
| updatedAt | DateTime | |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/reminders?userId=<uuid>` | Fetch all reminders (sorted by scheduledTime ASC) |
| POST | `/api/reminders` | Create reminder manually |
| POST | `/api/voice/process` | Upload audio → transcribe → parse → save |

### POST /api/reminders Body
```json
{
  "userId": "user-demo-123",
  "title": "תור לרופא שיניים",
  "scheduledTime": "2026-08-28T12:00:00.000+03:00",
  "phoneNumber": "031234567",
  "websiteUrl": "https://example.com"
}
```

### POST /api/voice/process
- Content-Type: `multipart/form-data`
- Field: `audio` (file, max 25MB)
- Supported formats: mp3, m4a, wav, webm, ogg, flac
- Returns: Created reminder + transcript + parsed intent

---

## Features

### 1. Voice-to-Reminder Pipeline
- User records audio via mic button
- Audio sent to backend as multipart form
- Groq Whisper transcribes Hebrew speech
- Groq LLM (qwen/qwen3.8-27b) parses intent into structured JSON
- Extracts: title, scheduledTime, phoneNumber, websiteUrl, notificationOffsetMinutes
- Timezone-aware: outputs Israel time (+03:00)
- Saves to PostgreSQL, returns reminder to frontend

### 2. Manual Reminder Creation
- Modal form with: title, date/time picker, phone, URL
- Custom Hebrew calendar component (no native picker dependency)
- Hour/minute spinners with arrow controls

### 3. Smart Local Notifications
- Automatic tiered scheduling based on time distance:
  - **> 7 days:** 1 week before → 1 day before → 2 hours before → exact
  - **2–7 days:** 1 day before → 2 hours before → exact
  - **5h–2 days:** 2 hours before → exact
  - **< 5 hours:** exact only
- Appointment detection (Hebrew keywords: תור, רופא, וטרינר, ספר, פגישה, ישיבה) adds 5-hours-before notification
- Foreground notifications display as alerts with sound
- Full sync on every dashboard load
- Works in Expo Go (local scheduling, no push)

### 4. Reminder Display
- Cards with Hebrew-friendly time formatting (היום/מחר/day name)
- Quick-dial button (opens phone dialer)
- Quick-link button (opens browser)
- Pull-to-refresh

### 5. Proactive Insights (UI Shell)
- ProactiveCard component for urgent notifications
- Currently: static insurance renewal demo
- Designed for future AI-driven proactive suggestions

### 6. Onboarding
- Module selection screen (groceries, insurance, finance, appointments)
- Checkbox-based selection with visual feedback

### 7. Profile & Documents (UI Shell)
- Document upload placeholders (insurance, medical)
- User info display

### 8. Grocery List (UI Shell)
- Smart grocery modal with frequency-based suggestions
- Savings comparison placeholder

---

## Frontend Structure

```
daily-frontend/
├── App.tsx                          # Root: screen nav + add modal + notification config
├── app.json                         # Expo config (SDK 54, plugins)
├── src/
│   ├── api/
│   │   ├── reminderApi.ts           # GET/POST reminders
│   │   └── voiceApi.ts              # POST audio for voice processing
│   ├── components/
│   │   ├── DateTimePicker.tsx        # Custom Hebrew calendar + time picker
│   │   ├── Header.tsx                # App header with avatar
│   │   ├── ProactiveCard.tsx         # Urgent notification card
│   │   ├── ReminderCard.tsx          # Single reminder display
│   │   └── VoiceControls.tsx         # Mic button + recording UI
│   ├── config/
│   │   └── constants.ts              # API URLs, user ID
│   ├── screens/
│   │   ├── DashboardScreen.tsx       # Main screen
│   │   ├── GroceryModal.tsx          # Smart grocery list
│   │   ├── OnboardingScreen.tsx      # Module selection
│   │   └── ProfileScreen.tsx         # Profile & documents
│   ├── services/
│   │   └── notificationService.ts    # Local notification scheduling
│   └── types/
│       └── index.ts                  # Reminder, User, ApiResponse interfaces
```

---

## Backend Structure

```
daily-backend/
├── src/
│   ├── app.ts                       # Express setup, middleware, routes
│   ├── server.ts                    # Server entry point (port 3000)
│   ├── config/
│   │   └── db.ts                    # Prisma client singleton
│   ├── controllers/
│   │   ├── reminder.controller.ts   # CRUD for reminders
│   │   └── voice.controller.ts      # Audio → Whisper → LLM → DB
│   └── routes/
│       ├── reminder.routes.ts       # GET/POST /api/reminders
│       └── voice.routes.ts          # POST /api/voice/process (multer)
├── prisma/
│   ├── schema.prisma                # DB models
│   ├── seed.ts                      # Demo user seeding
│   └── migrations/                  # SQL migrations
├── docker-compose.yml               # PostgreSQL 15 container
└── package.json
```

---

## Infrastructure

| Service | Port | Notes |
|---------|------|-------|
| Backend (Express) | 3000 | Hot-reload via tsx watch |
| PostgreSQL | 5433 | Docker container, mapped from 5432 |
| Expo Dev Server | 8081 | Web + QR for Expo Go |

---

## Environment Variables (Backend)

| Key | Purpose |
|-----|---------|
| DATABASE_URL | PostgreSQL connection string |
| PORT | Server port (default: 3000) |
| GROQ_API_KEY | Groq API key for Whisper + LLM |

---

## Current Limitations / TODO

- [ ] Authentication (currently uses hardcoded `user-demo-123`)
- [ ] Reminder deletion / completion / editing
- [ ] Push notifications (requires dev build, not Expo Go)
- [ ] Receipt scanning (camera button is placeholder)
- [ ] Proactive insights (real AI analysis)
- [ ] Grocery list automation (real receipt parsing)
- [ ] Document upload (profile screen is placeholder)
- [ ] Multi-user support
- [ ] Offline support / caching
- [ ] expo-av migration to expo-audio (deprecated in SDK 55)

---

## Running the Project

```bash
# Backend
cd daily-backend
docker compose up -d
npm install
npx prisma migrate dev
npx prisma generate
npm run seed
npm run dev

# Frontend
cd daily-frontend
npm install
npx expo start
```

---

*Last updated: August 27, 2026*
