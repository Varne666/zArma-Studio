#!/bin/bash

# Dynamic root detection - works from any location
ROOT="$(cd "$(dirname "$0")" && pwd)"

# ═══════════════════════════════════════════════════════════════
# KILL EXISTING PROCESSES
# ═══════════════════════════════════════════════════════════════

echo "🧹 Cleaning up..."

pkill -9 -u "$USER" -f "node .*server\.js" 2>/dev/null || true
pkill -9 -u "$USER" -f "vite" 2>/dev/null || true

# Only kill Ollama if we're starting it (comment out if you want to keep Ollama running)
# pkill -9 -u "$USER" -f "ollama serve" 2>/dev/null || true

for p in 3000 3001 5173; do
  PID="$(lsof -tiTCP:$p -sTCP:LISTEN 2>/dev/null || true)"
  [ -n "$PID" ] && kill -9 $PID 2>/dev/null || true
done

sleep 1

# ═══════════════════════════════════════════════════════════════
# START OLLAMA (if installed)
# ═══════════════════════════════════════════════════════════════

echo "🤖 Checking Ollama..."

export PATH="/usr/local/bin:$HOME/.local/bin:$PATH"

start_ollama() {
  if command -v ollama >/dev/null 2>&1; then
    echo "🔌 Starting Ollama server..."
    gnome-terminal --title="OLLAMA-11434" -- bash -lc 'export PATH="/usr/local/bin:$HOME/.local/bin:$PATH"; echo "Starting Ollama..."; ollama serve; read -p "Press Enter to close..."' &
    
    # Wait for Ollama to be ready (up to 30 seconds)
    echo "⏳ Waiting for Ollama to start..."
    for i in $(seq 1 30); do
      if curl -fsS "http://127.0.0.1:11434/api/tags" >/dev/null 2>&1; then
        echo "✅ Ollama is ready"
        return 0
      fi
      sleep 1
    done
    echo "❌ Ollama failed to start"
    return 1
  else
    echo "⚠️  Ollama not found in PATH"
    echo "   Install from: https://ollama.com/download"
    return 1
  fi
}

# Check if Ollama is running, start if not
if ! curl -fsS "http://127.0.0.1:11434/api/tags" >/dev/null 2>&1; then
  start_ollama || {
    echo "❌ Cannot start Ollama - prompt generation won't work!"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
  }
else
  echo "✅ Ollama already running"
fi

# Check if required model is available
echo "📦 Checking model..."
MODEL="qwen2.5:7b-instruct-q4_0"
if command -v ollama >/dev/null 2>&1; then
  if ! ollama list | grep -q "$MODEL"; then
    echo "📥 Model $MODEL not found. Pulling..."
    ollama pull "$MODEL" || {
      echo "⚠️  Failed to pull model. Trying fallback: dolphin-mistral:7b"
      MODEL="dolphin-mistral:7b"
      ollama pull "$MODEL" || {
        echo "❌ Failed to pull fallback model"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
      }
    }
  else
    echo "  ✓ Model $MODEL available"
  fi
fi

# ═══════════════════════════════════════════════════════════════
# START BACKEND 3001
# ═══════════════════════════════════════════════════════════════

echo "📡 Starting Backend..."

export OLLAMA_URL="http://127.0.0.1:11434"
export DEFAULT_MODEL="$MODEL"

cd "$ROOT/app/backend" && gnome-terminal --title="BACKEND-3001" -- bash -lc \
"cd '$ROOT/app/backend' && export OLLAMA_URL='$OLLAMA_URL' && export DEFAULT_MODEL='$DEFAULT_MODEL' && PORT=3001 node server.js; read -p 'Press Enter to close...'" &

# Wait for backend
echo "⏳ Waiting for backend..."
for i in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:3001/api/ollama-status" >/dev/null 2>&1; then
    echo "✅ Backend ready"
    break
  fi
  if [ $i -eq 60 ]; then
    echo "❌ Backend failed to start - check terminal for errors"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
  fi
  sleep 0.5
done

# ═══════════════════════════════════════════════════════════════
# START FRONTEND 3000
# ═══════════════════════════════════════════════════════════════

echo "🎨 Starting Frontend..."

cd "$ROOT/app" && gnome-terminal --title="FRONTEND-3000" -- bash -lc \
"cd '$ROOT/app' && npm run dev -- --host --port 3000; read -p 'Press Enter to close...'" &

# Wait for frontend port
echo "⏳ Waiting for frontend..."
for i in $(seq 1 30); do
  if curl -fsS "http://localhost:3000" >/dev/null 2>&1; then
    echo "✅ Frontend ready"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "⚠️  Frontend didn't respond (might still be starting)"
  fi
  sleep 0.5
done

sleep 2

# ═══════════════════════════════════════════════════════════════
# OPEN BROWSER
# ═══════════════════════════════════════════════════════════════

echo "🌐 Opening browser..."
xdg-open "http://localhost:3000" 2>/dev/null || \
sensible-browser "http://localhost:3000" 2>/dev/null || \
echo "  Please open http://localhost:3000 manually"

echo ""
echo "═══════════════════════════════════════════════════"
echo "   zArma Studio is running!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo "   Ollama:   http://localhost:11434"
echo "   Model:    $MODEL"
echo "═══════════════════════════════════════════════════"
echo ""
echo "💡 Close any terminal window to stop that service"
echo "💡 Or press Ctrl+C in the terminal to stop gracefully"
