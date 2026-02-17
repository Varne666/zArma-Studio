#!/bin/bash
ROOT="/home/arma/Downloads/zArma Studio"

echo "🚀 Starting zArma Studio..."

# Kill existing processes
pkill -9 -u "$USER" -f "node .*server\.js" 2>/dev/null || true
pkill -9 -u "$USER" -f "vite" 2>/dev/null || true

for p in 3000 3001 5173; do
  PID="$(lsof -tiTCP:$p -sTCP:LISTEN 2>/dev/null || true)"
  [ -n "$PID" ] && kill -9 $PID 2>/dev/null || true
done

sleep 1

# Backend 3001
echo "📡 Starting Backend on port 3001..."
gnome-terminal --title="BACKEND-3001" -- bash -lc \
'cd "'"$ROOT"'/app/backend" && PORT=3001 OLLAMA_URL="http://127.0.0.1:11434" DEFAULT_MODEL="dolphin-mistral:7b" node server.js' &

# Wait for backend
echo "⏳ Waiting for backend..."
for i in $(seq 1 30); do
  curl -fsS "http://127.0.0.1:3001/api/ollama-status" >/dev/null 2>&1 && { echo "✅ Backend ready"; break; }
  sleep 0.5
done

# Frontend 3000 (Vite dev server with proxy to backend)
echo "🎨 Starting Frontend on port 3000..."
gnome-terminal --title="FRONTEND-3000" -- bash -lc \
'cd "'"$ROOT"'/app" && npm run dev -- --host' &

sleep 4
echo "🌐 Opening browser..."
xdg-open "http://localhost:3000"
