#!/usr/bin/env python3
"""
ARMscaler — Direct DiffBIR Inference
Simple wrapper that calls armscaler_server.py
"""

import sys
import os
import json
import subprocess
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent.resolve()
DIFFBIR_DIR = SCRIPT_DIR / 'diffbir_engine'
SERVER_SCRIPT = SCRIPT_DIR / 'armscaler_server.py'

def log(msg):
    print(f"  {msg}", file=sys.stderr, flush=True)

def check_setup():
    if not DIFFBIR_DIR.exists():
        return False, f"DiffBIR not found"
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
    """Run inference - server.py handles everything"""
    
    ok, msg = check_setup()
    if not ok:
        return False, msg
    
    # Read input
    try:
        with open(input_path, 'rb') as f:
            import base64
            image_base64 = base64.b64encode(f.read()).decode('utf-8')
    except Exception as e:
        return False, f"Cannot read input: {e}"
    
    # Run server script
    env = os.environ.copy()
    env['PYTHONPATH'] = str(DIFFBIR_DIR) + ':' + env.get('PYTHONPATH', '')
    env['PYTHONUNBUFFERED'] = '1'
    
    log(f"Starting DiffBIR inference ({quality} mode)...")
    log("Loading models into GPU (first run takes ~30-60s)...")
    
    # Use subprocess.run for simplicity
    cmd_input = json.dumps({
        'action': 'process',
        'image_base64': image_base64,
        'task': task,
        'upscale': int(upscale),
        'quality': quality
    }) + '\n'
    
    proc = subprocess.run(
        [sys.executable, '-u', str(SERVER_SCRIPT)],
        input=cmd_input,
        capture_output=True,
        text=True,
        env=env,
        timeout=600 if quality == 'quality' else 300
    )
    
    # Parse output - find the last JSON line
    lines = proc.stdout.strip().split('\n')
    response = None
    for line in reversed(lines):
        line = line.strip()
        if line.startswith('{'):
            try:
                response = json.loads(line)
                break
            except:
                continue
    
    # Log server output
    for line in lines:
        if line.strip() and not line.strip().startswith('{'):
            log(line.strip())
    
    if proc.returncode != 0:
        return False, f"Server error: {proc.stderr[:500]}"
    
    if not response:
        return False, "No response from server"
    
    if not response.get('success'):
        return False, response.get('error', 'Processing failed')
    
    # Write output
    try:
        import base64
        with open(output_path, 'wb') as f:
            f.write(base64.b64decode(response['image_base64']))
        return True, f"Done in {response.get('processing_time', 0)}s"
    except Exception as e:
        return False, f"Failed to write output: {e}"

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
