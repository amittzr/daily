# Daily App — Current System State (MVP Skeleton)

## What it is

A smart personal assistant app focused on the **Reminders** vertical. The system is an end-to-end working prototype: a React Native cross-platform frontend communicates with a Node.js REST API backed by a PostgreSQL database.

---

## Architecture

```
┌─────────────────────┐       HTTP (JSON)       ┌──────────────────────┐       SQL        ┌─────────────┐
│  daily-frontend     │ ◄──────────────────────► │  daily-backend       │ ◄───────────────► │ PostgreSQL  │
│  React Native/Expo  │    localhost:3000        │  Express + Prisma    │   localhost:5433  │ (Docker)    │
│  (Web/iOS/Android)  │                          │  TypeScript (ESM)    │                   │             │
└─────────────────────┘                          └──────────────────────┘                   └─────────────┘
```

---

## Database Layer

- **PostgreSQL 15** running in Docker (port 5433)
- **ORM**: Prisma 6.x with TypeScript
- **Models**:
  - `User` — id (UUID), email (unique), firstName, createdAt, updatedAt
  - `Reminder` — id (UUID), userId (FK → User), title, description?, scheduledTime, phoneNumber?, websiteUrl?, status (default: "pending"), isProactive (default: false), createdAt, updatedAt
- **Relationships**: User has many Reminders. Cascade delete on user removal.
- **Indexes**: on userId and scheduledTime for query performance.
- **Seed data**: One demo user (`id: "user-demo-123"`, email: amit@daily-demo.com)

---

## Backend API

- **Runtime**: Node.js with TypeScript (ESM, `tsx` for dev hot-reload)
- **Framework**: Express.js
- **CORS**: Enabled (allows frontend requests from any origin)
- **Endpoints**:

| Method | Route | What it does |
|--------|-------|-------------|
| GET | `/health` | Health check |
| GET | `/api/reminders?userId=<id>` | Returns all reminders for user, sorted by scheduledTime ASC |
| POST | `/api/reminders` | Creates a reminder (requires: userId, title, scheduledTime) |

- **Response format**: `{ success: boolean, data?: T, error?: string }`
- **Validation**: Checks required fields, validates ISO date format. Returns 400 on bad input, 500 on server errors.
- **No authentication** — uses a hardcoded demo userId for MVP.

---

## Frontend (React Native + Expo)

- **Platforms**: Web, iOS, Android (single codebase)
- **Screens**:
  - `OnboardingScreen` — module selection checklist (groceries, insurance, finance, appointments)
  - `DashboardScreen` — main screen showing live reminders fetched from the API, pull-to-refresh, proactive alert card
  - `ProfileScreen` — user info and document upload placeholders
  - `GroceryModal` — mock smart grocery list bottom sheet
- **Components**:
  - `Header` — top bar with user avatar and profile navigation
  - `ProactiveCard` — red alert card for urgent notifications (e.g., insurance expiry)
  - `ReminderCard` — displays a single reminder with dynamic "Call" / "Open Website" action buttons
  - `VoiceControls` — floating bottom action bar (microphone, camera, add button)
  - `DateTimePicker` — custom inline calendar grid + time input (works on all platforms including web)
- **API integration**:
  - Centralized in `src/api/reminderApi.ts`
  - Fetches reminders on dashboard load
  - Creates reminders via form or voice simulation
  - Platform-aware URL config (handles Android emulator → `10.0.2.2`)
- **State management**: React hooks (useState, useEffect). No external state library.

---

## What works end-to-end right now

1. User opens the app → sees onboarding → enters dashboard
2. Dashboard fetches reminders from the backend and displays them (or shows empty state)
3. User taps "+" → gets a form with custom calendar date picker + time input → submits → reminder is saved to PostgreSQL → list refreshes
4. User taps microphone → simulates voice → creates a demo reminder in the backend
5. Reminder cards show "Call" / "Website" buttons dynamically based on data
6. Pull-to-refresh on the dashboard reloads from the backend
7. Prisma Studio available at localhost:5555 for direct DB inspection

---

## What does NOT exist yet

- No real authentication or user management
- No push notifications or scheduled reminder triggering
- No actual voice recognition (mic is simulated)
- No camera/document scanning functionality
- No insurance comparison logic (static mock data)
- No grocery list intelligence (static mock data)
- No deployment configuration (everything runs locally)

---

## DevOps & Tooling

- **Docker Compose**: PostgreSQL container with named volume persistence
- **Scripts**: `start.sh` (boots everything) / `stop.sh` (tears down)
- **Git**: Initialized, remote at github.com/amittzr/daily
- **Prisma CLI**: migrate, generate, studio, seed

---

## Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | React Native + Expo | SDK 52 |
| Frontend Language | TypeScript | 5.6 |
| Backend Runtime | Node.js + tsx | 18+ |
| Backend Framework | Express.js | 4.21 |
| ORM | Prisma | 6.19 |
| Database | PostgreSQL | 15 |
| Containerization | Docker Compose | 3.9 |
| Icons | @expo/vector-icons (Ionicons) | 14 |

---

*Last updated: July 2026*
