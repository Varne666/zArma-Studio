#!/usr/bin/env python3
"""
ARMscaler Persistent Model Server v6
Loads models ONCE, keeps in GPU memory for 5-10x faster inference
"""

import os
import sys
import json
import time
import base64
import io
import tempfile
from pathlib import Path
from typing import Optional, Dict, Any
import threading

# Aggressive CUDA optimizations BEFORE importing torch
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "max_split_size_mb:512,expandable_segments:True"
os.environ["NVIDIA_TF32_OVERRIDE"] = "1"
os.environ["CUDA_LAUNCH_BLOCKING"] = "0"
os.environ["CUBLAS_WORKSPACE_CONFIG"] = ":4096:8"
os.environ["OMP_NUM_THREADS"] = "8"
os.environ["MKL_NUM_THREADS"] = "8"
os.environ["TORCH_CUDNN_V8_API_ENABLED"] = "1"
os.environ["CUDA_MODULE_LOADING"] = "LAZY"

import torch
import numpy as np
from PIL import Image

# Enable TF32 for Ampere GPUs (RTX 3090/4090) - 2x speedup
torch.backends.cuda.matmul.allow_tf32 = True
torch.backends.cudnn.allow_tf32 = True
torch.backends.cudnn.benchmark = True

SCRIPT_DIR = Path(__file__).parent.resolve()
DIFFBIR_DIR = SCRIPT_DIR / 'diffbir_engine'
sys.path.insert(0, str(DIFFBIR_DIR))

# Global state
_model_cache: Dict[str, Any] = {}
_server_ready = False
_server_stats = {"jobs_completed": 0, "jobs_failed": 0, "total_time": 0.0}
_server_lock = threading.Lock()
_loop_instance = None

def log(msg: str, level: str = "INFO"):
    print(json.dumps({"level": level, "message": msg, "timestamp": time.time()}), flush=True)

def set_random_seed(seed=None):
    """Set random seed for reproducibility"""
    import random
    if seed is not None:
        random.seed(seed)
        np.random.seed(seed)
        torch.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)

def get_gpu_info():
    if torch.cuda.is_available():
        name = torch.cuda.get_device_name(0)
        vram = torch.cuda.get_device_properties(0).total_memory / 1024**3
        capability = torch.cuda.get_device_capability(0)
        return {
            'available': True,
            'name': name,
            'vram_gb': round(vram, 1),
            'cuda_capability': capability,
            'is_ampere': capability[0] >= 8
        }
    return {'available': False, 'name': 'CPU', 'vram_gb': 0, 'is_ampere': False}

# Quality presets
QUALITY_PRESETS = {
    'turbo':     {'steps': 8,  'cfg_scale': 3.0, 'sampler': 'spaced'},
    'fast':      {'steps': 15, 'cfg_scale': 3.5, 'sampler': 'spaced'},
    'balanced':  {'steps': 25, 'cfg_scale': 3.5, 'sampler': 'spaced'},
    'quality':   {'steps': 40, 'cfg_scale': 3.5, 'sampler': 'spaced'},
}

def load_models():
    """Lazy load DiffBIR models"""
    global _loop_instance, _server_ready
    
    if _loop_instance is not None:
        return True
    
    try:
        log("Importing DiffBIR modules...")
        from diffbir.inference.loop import InferenceLoop
        
        log("Loading models into GPU memory (this takes ~30-60s)...")
        start = time.time()
        
        gpu = get_gpu_info()
        device = 'cuda' if gpu['available'] else 'cpu'
        precision = 'fp16' if gpu['available'] else 'fp32'
        
        # Create minimal args for loading
        _device = 'cuda' if gpu['available'] else 'cpu'
        _precision = 'fp16' if gpu['available'] else 'fp32'
        
        class Args:
            pass
        
        args = Args()
        args.task = 'sr'
        args.upscale = 4
        args.version = 'v2'
        args.sampler = 'spaced'
        args.steps = 25
        args.cfg_scale = 3.5
        args.device = _device
        args.precision = _precision
        args.captioner = 'none'
        args.seed = -1
        args.guidance = None
        args.g_loss = 'mse'
        args.g_scale = 1.0
        args.g_start = 0
        args.g_stop = 1.0
        args.g_space = 'latent'
        args.g_repeat = 1
        args.num_samples = 1
        args.batch_size = 1
        args.show_lq = False
        # Tiling
        args.cleaner_tiled = True
        args.cleaner_tile_size = 512
        args.cleaner_tile_stride = 256
        args.vae_encoder_tiled = True
        args.vae_encoder_tile_size = 512
        args.vae_decoder_tiled = True
        args.vae_decoder_tile_size = 512
        args.cldm_tiled = True
        args.cldm_tile_size = 1024
        args.cldm_tile_stride = 512
        args.strength = 1.0
        args.start_point_type = 'cond'
        args.pos_prompt = ''
        args.neg_prompt = ''
        args.n_samples = 1
        
        args = Args()
        
        # Load inference loop (this loads all models)
        _loop_instance = InferenceLoop(args)
        
        load_time = time.time() - start
        log(f"Models loaded in {load_time:.1f}s")
        _server_ready = True
        return True
        
    except Exception as e:
        log(f"Failed to load models: {e}", "ERROR")
        import traceback
        log(traceback.format_exc(), "ERROR")
        return False

def process_image(image_base64: str, task: str = 'sr', upscale: int = 4, quality: str = 'balanced') -> Dict[str, Any]:
    """Process a single image"""
    global _server_stats
    
    start_time = time.time()
    job_id = f"job_{int(start_time * 1000)}"
    
    log(f"[{job_id}] Starting {task} | {upscale}x | {quality}")
    
    try:
        # Load models if needed
        if not load_models():
            return {'success': False, 'error': 'Failed to load models', 'job_id': job_id}
        
        # Decode image
        image_data = base64.b64decode(image_base64)
        input_image = Image.open(io.BytesIO(image_data)).convert('RGB')
        orig_w, orig_h = input_image.size
        
        # Get quality preset
        preset = QUALITY_PRESETS.get(quality, QUALITY_PRESETS['balanced'])
        
        # Update loop args for this run
        _loop_instance.args.task = task
        _loop_instance.args.upscale = upscale
        _loop_instance.args.steps = preset['steps']
        _loop_instance.args.cfg_scale = preset['cfg_scale']
        _loop_instance.args.sampler = preset['sampler']
        
        log(f"[{job_id}] Processing {orig_w}x{orig_h}...")
        inference_start = time.time()
        
        # Create temp directories
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / 'input.png'
            output_dir = tmp_path / 'output'
            output_dir.mkdir()
            
            # Save input
            input_image.save(input_path)
            
            # Set args
            _loop_instance.args.input = str(input_path)
            _loop_instance.args.output = str(output_dir)
            
            # Run inference
            set_random_seed(None)
            
            _loop_instance.setup()
            results = []
            for lq in _loop_instance.load_lq():
                caption = _loop_instance.captioner(lq)
                pos_prompt = ", ".join([text for text in [caption, _loop_instance.args.pos_prompt] if text])
                
                lq_array = np.array(lq)
                n_samples = _loop_instance.args.n_samples
                batch_size = _loop_instance.args.batch_size
                num_batches = (n_samples + batch_size - 1) // batch_size
                
                for i in range(num_batches):
                    n_inputs = min((i + 1) * batch_size, n_samples) - i * batch_size
                    with torch.no_grad():
                        with torch.autocast(_loop_instance.args.device, torch.float16 if _loop_instance.args.precision == 'fp16' else torch.float32):
                            batch_samples = _loop_instance.pipeline.run(
                                np.tile(lq_array[None], (n_inputs, 1, 1, 1)),
                                _loop_instance.args.steps,
                                _loop_instance.args.strength,
                                _loop_instance.args.cleaner_tiled,
                                _loop_instance.args.cleaner_tile_size,
                                _loop_instance.args.cleaner_tile_stride,
                                _loop_instance.args.vae_encoder_tiled,
                                _loop_instance.args.vae_encoder_tile_size,
                                _loop_instance.args.vae_decoder_tiled,
                                _loop_instance.args.vae_decoder_tile_size,
                                _loop_instance.args.cldm_tiled,
                                _loop_instance.args.cldm_tile_size,
                                _loop_instance.args.cldm_tile_stride,
                                pos_prompt,
                                _loop_instance.args.neg_prompt,
                                _loop_instance.args.cfg_scale,
                                _loop_instance.args.start_point_type,
                                _loop_instance.args.sampler,
                                0,  # noise_aug
                                False,  # rescale_cfg
                                0.0,  # s_churn
                                0.0,  # s_tmin
                                float('inf'),  # s_tmax
                                1.0,  # s_noise
                                0.0,  # eta
                                1,  # order
                            )
                    results.extend(batch_samples)
            
            inference_time = time.time() - inference_start
            
            # Save and encode result
            if results:
                result_img = results[0]
                buffer = io.BytesIO()
                result_img.save(buffer, format='PNG')
                output_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                out_w, out_h = result_img.size
            else:
                raise RuntimeError("No output produced")
        
        total_time = time.time() - start_time
        
        with _server_lock:
            _server_stats["jobs_completed"] += 1
            _server_stats["total_time"] += total_time
        
        log(f"[{job_id}] Done: {out_w}x{out_h} in {total_time:.2f}s")
        
        return {
            'success': True,
            'image_base64': output_base64,
            'input_size': {'w': orig_w, 'h': orig_h},
            'output_size': {'w': out_w, 'h': out_h},
            'processing_time': round(total_time, 2),
            'inference_time': round(inference_time, 2),
            'job_id': job_id
        }
        
    except Exception as e:
        with _server_lock:
            _server_stats["jobs_failed"] += 1
        log(f"[{job_id}] Error: {str(e)}", "ERROR")
        import traceback
        log(traceback.format_exc(), "ERROR")
        return {
            'success': False,
            'error': str(e),
            'job_id': job_id
        }

def handle_command(cmd: Dict[str, Any]) -> Dict[str, Any]:
    """Handle incoming commands"""
    action = cmd.get('action')
    
    if action == 'status':
        return {
            'ready': _server_ready,
            'gpu': get_gpu_info(),
            'stats': _server_stats,
            'models_loaded': _loop_instance is not None
        }
    
    elif action == 'process':
        return process_image(
            image_base64=cmd.get('image_base64', ''),
            task=cmd.get('task', 'sr'),
            upscale=cmd.get('upscale', 4),
            quality=cmd.get('quality', 'balanced')
        )
    
    elif action == 'ping':
        return {'pong': True, 'ready': _server_ready}
    
    else:
        return {'error': f'Unknown action: {action}'}

def main():
    """Main server loop"""
    global _server_ready
    
    log("ARMscaler Model Server v6 starting...")
    log(f"PyTorch: {torch.__version__}")
    log(f"CUDA available: {torch.cuda.is_available()}")
    
    if torch.cuda.is_available():
        log(f"GPU: {torch.cuda.get_device_name(0)}")
        log(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f}GB")
    
    # Check DiffBIR setup
    if not DIFFBIR_DIR.exists():
        log(f"DiffBIR not found at {DIFFBIR_DIR}", "ERROR")
        return 1
    
    log("Server ready. Models will load on first request.")
    _server_ready = True
    
    # Main command loop
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        
        try:
            cmd = json.loads(line)
            response = handle_command(cmd)
            print(json.dumps(response), flush=True)
        except json.JSONDecodeError as e:
            print(json.dumps({'error': f'Invalid JSON: {e}'}), flush=True)
        except Exception as e:
            log(f"Command error: {e}", "ERROR")
            print(json.dumps({'error': str(e)}), flush=True)
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
