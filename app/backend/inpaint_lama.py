#!/usr/bin/env python3
"""
Z-Image Watermark Remover — LaMa ONNX Inpainting Engine v7

THE KEY FIX: Zero out masked pixels before LaMa inference.
LaMa is an inpainting model that fills "missing" regions. If the watermark
pixels are left intact in the input, LaMa sees them as valid content and
preserves them. The mask area must be blanked (set to 0) so LaMa knows
to regenerate those pixels.

Pipeline:
1. Refine oversized detection → actual ~60px watermark corner
2. Crop generous square around watermark
3. Resize crop to 512×512
4. ZERO OUT masked pixels in input image ← THIS IS THE FIX
5. Run LaMa inference
6. Resize result back to crop size
7. Composite only masked pixels back into original
"""

import sys
import os
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

LAMA_SIZE = 512
WATERMARK_SIZE = 60
REFINE_THRESHOLD = 80


def log(msg):
    print(f"  {msg}", file=sys.stderr)


def load_model(model_path):
    import onnxruntime as ort
    opts = ort.SessionOptions()
    opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    providers = ['CPUExecutionProvider']
    try:
        avail = ort.get_available_providers()
        if 'CUDAExecutionProvider' in avail:
            providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']
            log("GPU: CUDA")
        else:
            log("GPU: CPU")
    except Exception:
        pass
    return ort.InferenceSession(model_path, opts, providers=providers)


def refine_to_corner(img_w, img_h, x, y, w, h):
    """Narrow oversized detection regions to the actual corner watermark."""
    if w <= REFINE_THRESHOLD or h <= REFINE_THRESHOLD:
        return x, y, w, h

    region_x2 = x + w
    region_y2 = y + h
    wm = WATERMARK_SIZE
    corners = []

    if region_x2 >= img_w - wm and region_y2 >= img_h - wm:
        corners.append(('bottom-right', img_w - wm, img_h - wm, wm, wm))
    if x <= wm and region_y2 >= img_h - wm:
        corners.append(('bottom-left', 0, img_h - wm, wm, wm))
    if region_x2 >= img_w - wm and y <= wm:
        corners.append(('top-right', img_w - wm, 0, wm, wm))
    if x <= wm and y <= wm:
        corners.append(('top-left', 0, 0, wm, wm))

    if not corners:
        return x, y, w, h

    rcx, rcy = x + w / 2, y + h / 2
    best = min(corners, key=lambda c: (c[1] + c[3]/2 - rcx)**2 + (c[2] + c[4]/2 - rcy)**2)
    name, cx, cy, cw, ch = best
    log(f"Refined: {w}x{h} -> {cw}x{ch} at {name} corner ({cx},{cy})")
    return cx, cy, cw, ch


def inpaint(input_path, output_path, x, y, w, h, padding=5, model_path=None, debug=False):
    debug_dir = os.path.dirname(output_path) or '.'

    # ── Find model ──
    if model_path is None:
        model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                  'models', 'lama_fp32.onnx')
    if not os.path.exists(model_path):
        log(f"ERROR: Model not found: {model_path}")
        sys.exit(1)
    log(f"Model: {os.path.basename(model_path)} ({os.path.getsize(model_path) // 1024 // 1024}MB)")

    # ── Load image ──
    original = Image.open(input_path).convert('RGB')
    orig_w, orig_h = original.size
    log(f"Image: {orig_w}x{orig_h}")
    log(f"Input region: ({x},{y}) {w}x{h}")

    # ── Step 1: Refine to actual watermark ──
    rx, ry, rw, rh = refine_to_corner(orig_w, orig_h, x, y, w, h)
    log(f"Mask region: ({rx},{ry}) {rw}x{rh}")

    # ── Step 2: Mask bounds with padding ──
    mask_x1 = max(0, rx - padding)
    mask_y1 = max(0, ry - padding)
    mask_x2 = min(orig_w, rx + rw + padding)
    mask_y2 = min(orig_h, ry + rh + padding)

    # ── Step 3: Compute crop — 4x mask size for good context ──
    mask_w = mask_x2 - mask_x1
    mask_h = mask_y2 - mask_y1
    crop_size = max(mask_w * 4, mask_h * 4, 200)
    crop_size = min(crop_size, min(orig_w, orig_h))

    mask_cx = (mask_x1 + mask_x2) // 2
    mask_cy = (mask_y1 + mask_y2) // 2

    crop_x1 = max(0, mask_cx - crop_size // 2)
    crop_y1 = max(0, mask_cy - crop_size // 2)
    crop_x2 = min(orig_w, crop_x1 + crop_size)
    crop_y2 = min(orig_h, crop_y1 + crop_size)

    if crop_x2 - crop_x1 < crop_size:
        crop_x1 = max(0, crop_x2 - crop_size)
    if crop_y2 - crop_y1 < crop_size:
        crop_y1 = max(0, crop_y2 - crop_size)

    crop_w = crop_x2 - crop_x1
    crop_h = crop_y2 - crop_y1
    log(f"Crop: ({crop_x1},{crop_y1})-({crop_x2},{crop_y2}) = {crop_w}x{crop_h}")

    # ── Step 4: Extract crop and create mask ──
    crop_img = original.crop((crop_x1, crop_y1, crop_x2, crop_y2))

    crop_mask = Image.new('L', (crop_w, crop_h), 0)
    draw = ImageDraw.Draw(crop_mask)
    draw.rectangle([
        mask_x1 - crop_x1, mask_y1 - crop_y1,
        mask_x2 - crop_x1, mask_y2 - crop_y1
    ], fill=255)

    if debug:
        crop_img.save(os.path.join(debug_dir, 'debug_01_crop.png'))
        crop_mask.save(os.path.join(debug_dir, 'debug_02_mask.png'))

    # ── Step 5: Resize to 512×512 ──
    lama_img = crop_img.resize((LAMA_SIZE, LAMA_SIZE), Image.LANCZOS)
    lama_mask = crop_mask.resize((LAMA_SIZE, LAMA_SIZE), Image.NEAREST)

    log(f"Resize: {crop_w}x{crop_h} -> {LAMA_SIZE}x{LAMA_SIZE}")

    mask_px = (np.array(lama_mask) > 128).sum()
    log(f"LaMa mask: {mask_px} pixels")

    if mask_px == 0:
        log("WARNING: Empty mask. Copying original.")
        original.save(output_path, 'PNG', compress_level=1)
        return

    # ── Step 6: Prepare tensors ──
    img_np = np.array(lama_img).astype(np.float32) / 255.0   # [512, 512, 3]
    mask_np = np.array(lama_mask).astype(np.float32) / 255.0  # [512, 512]
    mask_binary = (mask_np > 0.5).astype(np.float32)

    # *** THE KEY FIX: Zero out masked pixels ***
    # LaMa needs masked pixels blanked so it knows to regenerate them.
    # Without this, LaMa preserves the watermark as "valid content".
    for c in range(3):
        img_np[:, :, c] *= (1.0 - mask_binary)

    if debug:
        # Save the zeroed input to verify
        zeroed_vis = (img_np * 255).astype(np.uint8)
        Image.fromarray(zeroed_vis).save(os.path.join(debug_dir, 'debug_03_lama_input_zeroed.png'))
        lama_mask.save(os.path.join(debug_dir, 'debug_04_lama_mask.png'))

    img_t = np.transpose(img_np, (2, 0, 1))[np.newaxis, ...]     # [1, 3, 512, 512]
    mask_t = mask_binary[np.newaxis, np.newaxis, ...]              # [1, 1, 512, 512]

    # ── Step 7: Run LaMa ──
    log("Loading LaMa model...")
    session = load_model(model_path)
    inp = [i.name for i in session.get_inputs()]
    out = [o.name for o in session.get_outputs()]

    log("Running inference...")
    result = session.run(out, {inp[0]: img_t, inp[1]: mask_t})

    raw = result[0]
    log(f"Output: shape={raw.shape} range=[{raw.min():.3f}, {raw.max():.3f}]")

    # Decode output
    out_img = raw[0]
    if out_img.shape[0] == 3:
        out_img = np.transpose(out_img, (1, 2, 0))

    if out_img.max() <= 1.5:
        out_uint8 = np.clip(out_img * 255, 0, 255).astype(np.uint8)
    else:
        out_uint8 = np.clip(out_img, 0, 255).astype(np.uint8)

    lama_result_512 = Image.fromarray(out_uint8, 'RGB')

    if debug:
        lama_result_512.save(os.path.join(debug_dir, 'debug_05_lama_output.png'))

    # ── Step 8: Resize result back to crop size ──
    result_crop = lama_result_512.resize((crop_w, crop_h), Image.LANCZOS)

    if debug:
        result_crop.save(os.path.join(debug_dir, 'debug_06_result_crop.png'))

    # ── Step 9: Composite with feathered mask ──
    blur_r = max(1, min(padding, 3))
    mask_feathered = crop_mask.filter(ImageFilter.GaussianBlur(radius=blur_r))

    orig_crop = original.crop((crop_x1, crop_y1, crop_x2, crop_y2))

    oa = np.array(orig_crop).astype(np.float32)
    ra = np.array(result_crop).astype(np.float32)
    alpha = np.array(mask_feathered).astype(np.float32) / 255.0
    alpha = alpha[:, :, np.newaxis]

    blended = oa * (1.0 - alpha) + ra * alpha
    blended = np.clip(blended, 0, 255).astype(np.uint8)

    if debug:
        Image.fromarray(blended).save(os.path.join(debug_dir, 'debug_07_blended.png'))

    # ── Step 10: Paste back into original ──
    output = original.copy()
    output.paste(Image.fromarray(blended), (crop_x1, crop_y1))

    output.save(output_path, 'PNG', compress_level=1)
    log(f"Output: {output_path}")
    log("Done!")


if __name__ == '__main__':
    if len(sys.argv) < 7:
        print(f"Usage: {sys.argv[0]} input output x y w h [padding] [model_path] [--debug]",
              file=sys.stderr)
        sys.exit(1)

    debug_mode = '--debug' in sys.argv
    args = [a for a in sys.argv[1:] if a != '--debug']

    inpaint(
        input_path=args[0],
        output_path=args[1],
        x=int(args[2]),
        y=int(args[3]),
        w=int(args[4]),
        h=int(args[5]),
        padding=int(args[6]) if len(args) > 6 else 5,
        model_path=args[7] if len(args) > 7 else None,
        debug=debug_mode,
    )
