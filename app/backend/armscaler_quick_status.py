#!/usr/bin/env python3
"""Quick status check without starting persistent server"""
import sys
import json
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent.resolve()
DIFFBIR_DIR = SCRIPT_DIR / 'diffbir_engine'

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

if __name__ == '__main__':
    ok, msg = check_setup()
    gpu = get_gpu_info()
    
    result = {
        'available': ok,
        'ready': ok,
        'setup_complete': ok,
        'message': msg,
        'gpu': gpu,
        'models_loaded': False
    }
    
    print(json.dumps(result))
