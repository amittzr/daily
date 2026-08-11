#!/bin/bash
# Daily App - Start Everything
echo "🚀 Starting Daily App..."

# 1. Start PostgreSQL (Docker)
echo "📦 Starting database..."
cd daily-backend
docker compose up -d
echo "✓ Database running on port 5433"

# 2. Start Backend Server (background)
echo "🖥️  Starting backend server..."
npm run dev &
BACKEND_PID=$!
echo "✓ Backend running on http://localhost:3000 (PID: $BACKEND_PID)"

# 3. Start Frontend (background)
echo "🎨 Starting frontend..."
cd ../daily-frontend
npx expo start --web &
FRONTEND_PID=$!
echo "✓ Frontend running on http://localhost:8081 (PID: $FRONTEND_PID)"

# Save PIDs for shutdown script
cd ..
echo "$BACKEND_PID" > .pids
echo "$FRONTEND_PID" >> .pids

echo ""
echo "========================================="
echo "  ✅ Daily App is running!"
echo "  Backend:  http://localhost:3000"
echo "  Frontend: http://localhost:8081"
echo "  Prisma:   run 'npx prisma studio' in daily-backend/"
echo "  Stop:     run './stop.sh'"
echo "========================================="

# Keep script alive so child processes stay running
wait
