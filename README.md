# Daily - Smart Personal Assistant

A proactive smart personal assistant app. MVP focused on the **Reminders** vertical.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native + Expo (iOS, Android, Web) |
| Backend | Node.js + Express + TypeScript (ESM) |
| Database | PostgreSQL 15 (via Docker) |
| ORM | Prisma 6.x |
| Dev Runner | tsx (hot-reload) |

---

## Project Structure

```
Daily/
├── daily-backend/       # Node.js API server
│   ├── src/
│   ├── prisma/
│   ├── docker-compose.yml
│   └── package.json
├── daily-frontend/      # React Native (Expo) app
│   ├── src/
│   ├── App.tsx
│   └── package.json
└── docs/                # HTML prototype & documentation
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git Bash](https://git-scm.com/) (recommended terminal on Windows)

---

## 🚀 Getting Started (First Time Setup)

### 1. Clone the repo

```bash
git clone https://github.com/amittzr/daily.git
cd daily
```

### 2. Backend Setup

```bash
cd daily-backend
npm install
cp .env.example .env
```

### 3. Start the Database

```bash
docker compose up -d
```

### 4. Run Prisma Migration + Generate Client

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Seed Demo Data

```bash
npm run seed
```

### 6. Frontend Setup

```bash
cd ../daily-frontend
npm install
```

---

## ▶️ Running the App

### Quick Start (one command)

```bash
./start.sh
```

This starts Docker + Backend + Frontend all at once.

### Quick Stop (one command)

```bash
./stop.sh
```

This stops everything cleanly.

> First time? Run `chmod +x start.sh stop.sh` to make them executable.

---

### Manual Start (separate terminals)

### Terminal 1 — Database (Docker)

```bash
cd daily-backend
docker compose up -d
```

### Terminal 2 — Backend Server

```bash
cd daily-backend
npm run dev
```

Server runs at: `http://localhost:3000`

### Terminal 3 — Frontend (Expo)

```bash
cd daily-frontend
npx expo start --web
```

Opens at: `http://localhost:8081`

For mobile: scan the QR code with Expo Go app.

---

## ⏹️ Stopping Everything

### Stop Backend Server

Press `Ctrl+C` in Terminal 2.

### Stop Frontend

Press `Ctrl+C` in Terminal 3.

### Stop Database (keeps data)

```bash
cd daily-backend
docker compose down
```

### Stop Database (wipe all data — fresh start)

```bash
cd daily-backend
docker compose down -v
```

---

## 🗄️ Database Management

### Prisma Studio (GUI — browse/edit data in browser)

```bash
cd daily-backend
npx prisma studio
```

Opens at: `http://localhost:5555`

### Create a New Migration (after schema changes)

```bash
cd daily-backend
npx prisma migrate dev --name describe_your_change
```

### Regenerate Prisma Client (after schema changes)

```bash
cd daily-backend
npx prisma generate
```

### Reset Database (drop all tables + re-migrate + re-seed)

```bash
cd daily-backend
npx prisma migrate reset
```

---

## 📡 API Endpoints

Base URL: `http://localhost:3000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/reminders?userId=user-demo-123` | Get all reminders for user |
| POST | `/api/reminders` | Create a reminder |

### POST Body Example

```json
{
  "userId": "user-demo-123",
  "title": "תור לרופא שיניים",
  "scheduledTime": "2026-07-25T10:00:00.000Z",
  "phoneNumber": "03-1234567",
  "websiteUrl": "https://example.com"
}
```

---

## 🐳 Docker Reference

| Command | What it does |
|---------|-------------|
| `docker compose up -d` | Start PostgreSQL in background |
| `docker compose down` | Stop PostgreSQL (keeps data) |
| `docker compose down -v` | Stop + delete all data |
| `docker compose ps` | Check if container is running |
| `docker compose logs` | View database logs |

Database connection: `localhost:5433` (mapped from container's 5432)

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `daily-backend/.env` | Database URL + port config |
| `daily-backend/prisma/schema.prisma` | Database models (User, Reminder) |
| `daily-backend/prisma/seed.ts` | Creates demo user for testing |
| `daily-backend/src/controllers/reminder.controller.ts` | API logic |
| `daily-frontend/src/config/constants.ts` | API URL config (platform-aware) |
| `daily-frontend/src/api/reminderApi.ts` | Frontend API calls |
| `daily-frontend/App.tsx` | Main app entry + screen management |

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| `Can't reach database at localhost:5433` | Run `docker compose up -d` first |
| `Foreign key constraint violated` | Run `npm run seed` to create demo user |
| PowerShell script execution error | Use Git Bash instead, or run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` |
| Frontend can't connect to backend | Make sure backend is running on port 3000 |
| Android emulator can't reach API | Uses `10.0.2.2:3000` automatically (see `constants.ts`) |

---

## 👥 Team

- **Amit** — Product Manager & Frontend
- Built with ❤️ and lots of coffee
