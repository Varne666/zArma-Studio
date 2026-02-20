#!/bin/bash
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/app"

# Kill any existing processes first
pkill -f "node server.js" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 1

# Start Backend in first terminal
gnome-terminal --title="Z-Image BACKEND" -- bash -c "cd '$ROOT/app/backend' && node server.js; read -p 'Press Enter to close...'" &

# Wait a moment
sleep 2

# Start Frontend in second terminal  
gnome-terminal --title="Z-Image FRONTEND" -- bash -c "cd '$ROOT/app' && npm run dev; read -p 'Press Enter to close...'" &

# Open browser after 5 seconds
sleep 5
xdg-open http://localhost:3000
