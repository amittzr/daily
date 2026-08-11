#!/bin/bash
# Daily App - Stop Everything
echo "⏹️  Stopping Daily App..."

# 1. Kill saved processes
if [ -f .pids ]; then
  while read pid; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null
      echo "✓ Stopped process $pid"
    fi
  done < .pids
  rm .pids
fi

# 2. Kill any remaining node/expo processes on our ports
# Backend on port 3000
lsof -ti:3000 2>/dev/null | xargs kill 2>/dev/null
# Frontend on port 8081
lsof -ti:8081 2>/dev/null | xargs kill 2>/dev/null

# 3. Stop Docker database
echo "📦 Stopping database..."
cd daily-backend
docker compose down
echo "✓ Database stopped"

echo ""
echo "========================================="
echo "  ✅ Daily App fully stopped."
echo "  To wipe DB data: cd daily-backend && docker compose down -v"
echo "========================================="
