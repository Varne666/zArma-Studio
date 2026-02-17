#!/usr/bin/env python3
"""
ARMscaler — Simple direct inference using DiffBIR's inference.py
"""

import sys
import os
import json
import subprocess
import tempfile
import shutil
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent.resolve()
DIFFBIR_DIR = SCRIPT_DIR / 'diffbir_engine'

def log(msg):
    print(f"  {msg}", file=sys.stderr, flush=True)

def check_setup():
    if not DIFFBIR_DIR.exists():
        return False, "DiffBIR not found"
    if not (DIFFBIR_DIR / 'inference.py').exists():
        return False, "inference.py not found"
    return True, "OK"

def get_gpu_info():
    try:
        import torch
        if torch.cuda.is_available():
            return {
                'available': True,
                'name': torch.cuda.get_device_name(0),
                'vram_gb': round(torch.cuda.get_device_properties(0).total_memory / 1024**3, 1)
            }
    except:
        pass
    return {'available': False, 'name': 'CPU', 'vram_gb': 0}

def status():
    ok, msg = check_setup()
    gpu = get_gpu_info()
    weights_dir = DIFFBIR_DIR / 'weights'
    models = len(list(weights_dir.glob('*.pth'))) if weights_dir.exists() else 0
    return {
        'available': ok, 'ready': ok, 'setup_complete': ok,
        'message': msg, 'gpu': gpu, 'models_downloaded': models
    }

def run_inference(input_path, output_path, task='sr', upscale=4, quality='balanced'):
    """Run inference using DiffBIR's inference.py directly"""
    
    ok, msg = check_setup()
    if not ok:
        return False, msg
    
    # Quality presets
    steps = {'turbo': 8, 'fast': 15, 'balanced': 25, 'quality': 40}.get(quality, 25)
    
    # Create temp directories
    with tempfile.TemporaryDirectory() as tmp_dir:
        input_dir = Path(tmp_dir) / 'input'
        output_dir = Path(tmp_dir) / 'output'
        input_dir.mkdir()
        output_dir.mkdir()
        
        # Copy input to temp dir
        temp_input = input_dir / 'input.png'
        shutil.copy2(input_path, temp_input)
        
        log(f"Running DiffBIR ({quality}, {steps} steps)...")
        
        env = os.environ.copy()
        env['PYTHONPATH'] = str(DIFFBIR_DIR) + ':' + env.get('PYTHONPATH', '')
        env['PYTHONUNBUFFERED'] = '1'
        env['PYTORCH_CUDA_ALLOC_CONF'] = 'max_split_size_mb:512,expandable_segments:True'
        env['NVIDIA_TF32_OVERRIDE'] = '1'
        
        # Build command
        cmd = [
            sys.executable, '-u',
            str(DIFFBIR_DIR / 'inference.py'),
            '--task', task,
            '--upscale', str(upscale),
            '--version', 'v2',
            '--steps', str(steps),
            '--cfg_scale', '3.5',
            '--input', str(input_dir),
            '--output', str(output_dir),
            '--device', 'cuda',
            '--precision', 'fp16',
            '--captioner', 'none',
            '--sampler', 'spaced',
            # Tiling for memory efficiency
            '--cleaner_tiled',
            '--cleaner_tile_size', '512',
            '--cleaner_tile_stride', '256',
            '--vae_encoder_tiled',
            '--vae_encoder_tile_size', '512',
            '--vae_decoder_tiled',
            '--vae_decoder_tile_size', '512',
            '--cldm_tiled',
            '--cldm_tile_size', '1024',
            '--cldm_tile_stride', '512',
        ]
        
        try:
            # Longer timeout for 4x upscale (larger output = more tiles)
            timeout = 900 if upscale >= 4 else 600
            if quality == 'quality':
                timeout = 1200
            elif quality == 'turbo':
                timeout = 600  # Turbo should be fast but 4x needs time
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                env=env,
                cwd=str(DIFFBIR_DIR),  # Run from diffbir_engine directory
                timeout=timeout
            )
            
            # Log output
            for line in result.stderr.split('\n'):
                if line.strip():
                    log(line.strip())
            
            if result.returncode != 0:
                return False, f"DiffBIR failed: {result.stderr[:500]}"
            
            # Find output
            outputs = list(output_dir.glob('*.png'))
            if not outputs:
                return False, "No output produced"
            
            shutil.copy2(outputs[0], output_path)
            return True, "OK"
            
        except subprocess.TimeoutExpired:
            return False, "Processing timeout"
        except Exception as e:
            return False, f"Error: {e}"

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <input> <output> [--task sr] [--upscale 4] [--quality turbo]")
        print(f"       {sys.argv[0]} --status")
        sys.exit(1)

    if sys.argv[1] == '--status':
        print(json.dumps(status(), indent=2))
        sys.exit(0)

    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else '/tmp/armscaler_output.png'

    kwargs = {}
    args = sys.argv[3:]
    i = 0
    while i < len(args):
        if args[i] == '--task' and i + 1 < len(args):
            kwargs['task'] = args[i + 1]; i += 2
        elif args[i] == '--upscale' and i + 1 < len(args):
            kwargs['upscale'] = int(args[i + 1]); i += 2
        elif args[i] == '--quality' and i + 1 < len(args):
            kwargs['quality'] = args[i + 1]; i += 2
        else:
            i += 1

    success, msg = run_inference(input_path, output_path, **kwargs)
    if success:
        log(msg)
    else:
        log(f"FAILED: {msg}")
        sys.exit(1)
