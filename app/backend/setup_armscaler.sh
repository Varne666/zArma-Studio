#!/bin/bash
# ============================================
# ARMscaler Setup — DiffBIR Integration
# Image Super-Resolution, Face Restoration, Denoising
# ============================================

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIFFBIR_DIR="$SCRIPT_DIR/diffbir_engine"

echo "╔══════════════════════════════════════════╗"
echo "║     ARMscaler Setup (DiffBIR v2.1)      ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Step 1: Check Python ──
PYTHON=""
if command -v python3 &>/dev/null; then PYTHON=python3
elif command -v python &>/dev/null; then PYTHON=python
else echo "ERROR: Python not found"; exit 1; fi
echo "✓ Python: $($PYTHON --version)"

# ── Step 2: Check PyTorch + CUDA ──
echo ""
echo "Checking PyTorch..."
$PYTHON -c "
import torch
print(f'  PyTorch: {torch.__version__}')
print(f'  CUDA available: {torch.cuda.is_available()}')
if torch.cuda.is_available():
    print(f'  GPU: {torch.cuda.get_device_name(0)}')
    print(f'  VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB')
" 2>/dev/null || {
    echo "WARNING: PyTorch not found. Installing..."
    $PYTHON -m pip install torch torchvision --break-system-packages 2>/dev/null || \
    $PYTHON -m pip install torch torchvision
}

# ── Step 3: Clone DiffBIR ──
echo ""
if [ -d "$DIFFBIR_DIR" ] && [ -f "$DIFFBIR_DIR/inference.py" ]; then
    echo "✓ DiffBIR already cloned at $DIFFBIR_DIR"
else
    echo "Cloning DiffBIR..."
    git clone https://github.com/XPixelGroup/DiffBIR.git "$DIFFBIR_DIR"
    echo "✓ DiffBIR cloned"
fi

# ── Step 4: Install dependencies ──
echo ""
echo "Installing DiffBIR dependencies (skipping PyTorch - already installed)..."
cd "$DIFFBIR_DIR"
# Install everything except torch/torchvision (already have 2.6.0+cu124)
$PYTHON -m pip install omegaconf accelerate einops opencv_python scipy ftfy regex python-dateutil timm pytorch-lightning tensorboard protobuf lpips facexlib diffusers safetensors --break-system-packages 2>/dev/null || \
$PYTHON -m pip install omegaconf accelerate einops opencv_python scipy ftfy regex python-dateutil timm pytorch-lightning tensorboard protobuf lpips facexlib diffusers safetensors
echo "✓ Dependencies installed"

# ── Step 5: Deploy CPU wrapper ──
echo ""
if [ -f "$SCRIPT_DIR/diffbir_cpu_wrapper.py" ]; then
    cp "$SCRIPT_DIR/diffbir_cpu_wrapper.py" "$DIFFBIR_DIR/cpu_wrapper.py"
    echo "✓ CPU compatibility wrapper deployed"
else
    echo "⚠ CPU wrapper not found — will be auto-generated on first run"
fi

# ── Step 5: Verify ──
echo ""
echo "Verifying installation..."
$PYTHON -c "
import torch
import diffusers
import safetensors
print('  torch:', torch.__version__)
print('  diffusers:', diffusers.__version__)
print('  CUDA:', torch.cuda.is_available())
print('  ✓ All dependencies OK')
" || {
    echo "Some dependencies may be missing. Try running:"
    echo "  cd $DIFFBIR_DIR && pip install -r requirements.txt"
}

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║         Setup Complete!                  ║"
echo "╠══════════════════════════════════════════╣"
echo "║  Models will auto-download on first use  ║"
echo "║  (~7GB total: SD v2.1 + DiffBIR weights) ║"
echo "║  First run takes 5-10 min to download    ║"
echo "║                                          ║"
echo "║  Restart server: node server.js          ║"
echo "╚══════════════════════════════════════════╝"
