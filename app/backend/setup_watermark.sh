#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Z-Image Watermark Remover — Setup Script
#  Downloads the LaMa AI inpainting model + installs dependencies
# ═══════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MODEL_DIR="$SCRIPT_DIR/models"
MODEL_FILE="$MODEL_DIR/lama_fp32.onnx"
MODEL_URL="https://huggingface.co/Carve/LaMa-ONNX/resolve/main/lama_fp32.onnx"

echo "══════════════════════════════════════════════════"
echo "  Z-Image Watermark Remover — Setup"
echo "══════════════════════════════════════════════════"
echo ""

# ── Step 1: Install Python dependencies ──
echo "[1/2] Installing Python dependencies..."
pip install onnxruntime numpy Pillow --break-system-packages -q 2>/dev/null || \
pip install onnxruntime numpy Pillow -q 2>/dev/null || \
pip3 install onnxruntime numpy Pillow --break-system-packages -q 2>/dev/null || \
pip3 install onnxruntime numpy Pillow -q

echo "  ✓ onnxruntime, numpy, Pillow installed"
echo ""

# ── Step 2: Download LaMa ONNX model ──
mkdir -p "$MODEL_DIR"

if [ -f "$MODEL_FILE" ]; then
    SIZE=$(stat -c%s "$MODEL_FILE" 2>/dev/null || stat -f%z "$MODEL_FILE" 2>/dev/null)
    if [ "$SIZE" -gt 100000000 ]; then
        echo "[2/2] LaMa model already downloaded ($(du -h "$MODEL_FILE" | cut -f1))"
        echo "  ✓ $MODEL_FILE"
    else
        echo "[2/2] Model file seems incomplete, re-downloading..."
        rm -f "$MODEL_FILE"
    fi
fi

if [ ! -f "$MODEL_FILE" ]; then
    echo "[2/2] Downloading LaMa ONNX model (~208MB)..."
    echo "  Source: $MODEL_URL"
    echo ""

    if command -v wget &> /dev/null; then
        wget -O "$MODEL_FILE" --show-progress "$MODEL_URL"
    elif command -v curl &> /dev/null; then
        curl -L -o "$MODEL_FILE" --progress-bar "$MODEL_URL"
    else
        echo "  ERROR: Neither wget nor curl found."
        echo "  Please download manually:"
        echo "    $MODEL_URL"
        echo "  And save to:"
        echo "    $MODEL_FILE"
        exit 1
    fi

    echo ""
    echo "  ✓ Model downloaded: $(du -h "$MODEL_FILE" | cut -f1)"
fi

echo ""
echo "══════════════════════════════════════════════════"
echo "  ✅ Setup complete!"
echo ""
echo "  Model:  $MODEL_FILE"
echo "  Python: $(python3 -c 'import onnxruntime; print(f"onnxruntime {onnxruntime.__version__}")' 2>/dev/null || echo 'checking...')"
echo ""
echo "  Now restart your backend:  cd app/backend && node server.js"
echo "══════════════════════════════════════════════════"
