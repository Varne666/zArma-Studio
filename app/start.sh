#!/bin/bash
echo "🔥 Starting Z-Image Prompt Generator by ARMA..."

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "⚠️  Starting Ollama server..."
    ollama serve &
    sleep 5
fi

# Install backend dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Build frontend if needed
if [ ! -d "dist" ]; then
    echo "🔨 Building frontend..."
    npm run build
fi

# Start backend
echo "🚀 Starting backend server..."
cd backend && npm start &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 2

# Serve frontend
echo "🌐 Starting frontend server..."
npx serve -s dist -p 3001

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null; exit" INT TERM EXIT
