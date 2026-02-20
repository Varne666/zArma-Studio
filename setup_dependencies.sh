#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  zArma Studio - System Dependencies Setup
#  Run this script to install all required dependencies
# ═══════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "══════════════════════════════════════════════════"
echo "  zArma Studio - Setup"
echo "══════════════════════════════════════════════════"
echo ""

# ── Check Python ──
echo "[1/5] Checking Python..."
if command -v python3 &>/dev/null; then
    PYTHON=python3
elif command -v python &>/dev/null; then
    PYTHON=python
else
    echo "ERROR: Python not found. Please install Python 3.10+"
    exit 1
fi
echo "  ✓ Python: $($PYTHON --version)"

# ── Install Python dependencies ──
echo ""
echo "[2/5] Installing Python dependencies..."
cd "$SCRIPT_DIR/app/backend"
$PYTHON -m pip install -r requirements.txt --break-system-packages 2>/dev/null || \
$PYTHON -m pip install -r requirements.txt
echo "  ✓ Python dependencies installed"

# ── Check Node.js ──
echo ""
echo "[3/5] Checking Node.js..."
if ! command -v node &>/dev/null; then
    echo "ERROR: Node.js not found. Please install Node.js 18+"
    echo "  Visit: https://nodejs.org/"
    exit 1
fi
echo "  ✓ Node.js: $(node --version)"

# ── Install Node dependencies ──
echo ""
echo "[4/5] Installing Node.js dependencies..."
cd "$SCRIPT_DIR/app"
if [ ! -d "node_modules" ]; then
    npm install
    echo "  ✓ Node dependencies installed"
else
    echo "  ✓ Node dependencies already installed"
fi

# ── Check Ollama ──
echo ""
echo "[5/5] Checking Ollama..."
if ! command -v ollama &>/dev/null; then
    echo "  ⚠ Ollama not found. Installing..."
    curl -fsSL https://ollama.com/install.sh | sh
fi

if curl -fsS "http://127.0.0.1:11434/api/tags" >/dev/null 2>&1; then
    echo "  ✓ Ollama is running"
    
    # Check for required models
    echo ""
    echo "Checking required models..."
    if ! ollama list | grep -q "dolphin-mistral"; then
        echo "  📦 Pulling dolphin-mistral:7b..."
        ollama pull dolphin-mistral:7b
    fi
    if ! ollama list | grep -q "bakllava"; then
        echo "  📦 Pulling bakllava:latest..."
        ollama pull bakllava:latest
    fi
    echo "  ✓ Models ready"
else
    echo "  ⚠ Ollama is installed but not running"
    echo "    Start it with: ollama serve"
fi

echo ""
echo "══════════════════════════════════════════════════"
echo "  ✅ Setup complete!"
echo ""
echo "  Next steps:"
echo "    1. Start Ollama: ollama serve"
echo "    2. Run ARMscaler setup: cd app/backend && bash setup_armscaler.sh"
echo "    3. Run Watermark setup: cd app/backend && bash setup_watermark.sh"
echo "    4. Start the app: ./start-zarma.sh"
echo "══════════════════════════════════════════════════"
