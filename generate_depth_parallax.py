"""
Depth-based parallax video generator — Juliet's Organic Meats
Uses Depth-Anything-V2-Small for monocular depth estimation (safetensors, ~97MB).
Near objects move MORE in the camera direction; far objects move LESS.
This creates genuine per-pixel parallax depth from a single still image.

Run: py -3.10 generate_depth_parallax.py
First run downloads ~97MB depth model once.
Outputs: explainer-video/public/videos/*.mp4  (30fps, H.264)
"""

import cv2
import numpy as np
import torch
from pathlib import Path
from PIL import Image
from transformers import AutoModelForDepthEstimation, AutoImageProcessor

# ── CONFIG ────────────────────────────────────────────────────────────────────

IMG_DIR  = Path(r"C:\Users\vefil\Desktop\Rabbit Farm\assets\explainer")
OUT_DIR  = Path(r"C:\Users\vefil\Desktop\Rabbit Farm\explainer-video\public\videos")
OUT_W, OUT_H = 1920, 1080
FPS          = 30
DEPTH_MODEL  = "depth-anything/Depth-Anything-V2-Small-hf"

# How many pixels the nearest object can travel across the full scene
PARALLAX_PX  = 85

OUT_DIR.mkdir(parents=True, exist_ok=True)

# ── SCENES ────────────────────────────────────────────────────────────────────

SCENES = [
    {"id": "01_aerial_farm",            "img": "01_aerial_farm.jpg",            "dur": 6, "motion": "zoom-in"},
    {"id": "02_rabbit_pov_running",     "img": "02_rabbit_pov_running.jpg",     "dur": 6, "motion": "drift-up"},
    {"id": "03_animals_sunset_portrait","img": "03_animals_sunset_portrait.jpg","dur": 7, "motion": "drift-left"},
    {"id": "04_farm_establishing",      "img": "04_farm_establishing.jpg",      "dur": 6, "motion": "drift-right"},
    {"id": "05_butcher_hands_vacuum",   "img": "05_butcher_hands_vacuum.jpg",   "dur": 6, "motion": "zoom-in"},
    {"id": "06_delivery_van_road",      "img": "06_delivery_van_road.jpg",      "dur": 7, "motion": "pan-right"},
    {"id": "07_premium_unboxing",       "img": "07_premium_unboxing.jpg",       "dur": 6, "motion": "zoom-in"},
    {"id": "08_chef_plating",           "img": "08_chef_plating.jpg",           "dur": 6, "motion": "drift-diagonal"},
    {"id": "09_family_table",           "img": "09_family_table.jpg",           "dur": 7, "motion": "zoom-in"},
    {"id": "10_product_hero",           "img": "10_product_hero.jpg",           "dur": 6, "motion": "drift-left"},
    {"id": "11_logo_hero",              "img": "11_logo_hero.jpg",              "dur": 8, "motion": "zoom-out"},
]

# ── DEPTH ESTIMATION ──────────────────────────────────────────────────────────

def load_depth_model():
    print("Loading Depth-Anything-V2-Small model (downloads ~97MB on first run)...")
    proc  = AutoImageProcessor.from_pretrained(DEPTH_MODEL)
    model = AutoModelForDepthEstimation.from_pretrained(DEPTH_MODEL)
    model.eval()
    return proc, model

def estimate_depth(proc, model, img_rgb: np.ndarray) -> np.ndarray:
    """Returns depth map (H, W) normalized 0-1.  High value = near."""
    pil = Image.fromarray(img_rgb)
    inputs = proc(images=pil, return_tensors="pt")
    with torch.no_grad():
        out = model(**inputs).predicted_depth
    # Resize to match image
    depth = torch.nn.functional.interpolate(
        out.unsqueeze(1),
        size=(img_rgb.shape[0], img_rgb.shape[1]),
        mode="bicubic", align_corners=False,
    ).squeeze().numpy()
    # Normalize so near=1, far=0
    depth = (depth - depth.min()) / (depth.max() - depth.min() + 1e-8)
    # Blur to smooth boundary transitions — reduces tearing at object edges
    depth = cv2.GaussianBlur(depth, (0, 0), sigmaX=10, sigmaY=10)
    depth = (depth - depth.min()) / (depth.max() - depth.min() + 1e-8)
    return depth.astype(np.float32)

# ── WARP ──────────────────────────────────────────────────────────────────────

OVERSCAN = 1.08  # Pre-zoom so depth warp never hits image edges

def make_remap(depth: np.ndarray, t: float, motion: str,
               W: int, H: int) -> tuple[np.ndarray, np.ndarray]:
    """
    Build CV2 remap maps (map_x, map_y) for a given time t in [0,1].
    Near pixels (depth≈1) are displaced more than far pixels (depth≈0).
    """
    cx, cy = W / 2.0, H / 2.0
    xs = np.arange(W, dtype=np.float32)
    ys = np.arange(H, dtype=np.float32)
    grid_x, grid_y = np.meshgrid(xs, ys)   # (H, W)

    # Pre-zoom: gives buffer room so warp displacement never clamps to edge
    gx = cx + (grid_x - cx) / OVERSCAN
    gy = cy + (grid_y - cy) / OVERSCAN

    d = depth  # (H, W)

    if motion == "zoom-in":
        zoom = 1.0 + t * 0.12 + t * 0.08 * d
        src_x = cx + (gx - cx) / zoom
        src_y = cy + (gy - cy) / zoom
    elif motion == "zoom-out":
        zoom = 1.0 + t * 0.10 + t * 0.06 * d
        src_x = cx + (gx - cx) * zoom
        src_y = cy + (gy - cy) * zoom
    elif motion == "pan-right":
        shift = t * PARALLAX_PX * d
        src_x = gx - shift
        src_y = gy
    elif motion == "pan-left":
        shift = t * PARALLAX_PX * d
        src_x = gx + shift
        src_y = gy
    elif motion == "pan-up":
        shift = t * PARALLAX_PX * d
        src_x = gx
        src_y = gy + shift
    elif motion == "drift-right":
        zoom  = 1.0 + t * 0.08 + t * 0.04 * d
        shift = t * PARALLAX_PX * 0.5 * d
        src_x = cx + (gx - cx) / zoom - shift
        src_y = cy + (gy - cy) / zoom
    elif motion == "drift-left":
        zoom  = 1.0 + t * 0.08 + t * 0.04 * d
        shift = t * PARALLAX_PX * 0.5 * d
        src_x = cx + (gx - cx) / zoom + shift
        src_y = cy + (gy - cy) / zoom
    elif motion == "drift-up":
        zoom  = 1.0 + t * 0.08 + t * 0.04 * d
        shift = t * PARALLAX_PX * 0.5 * d
        src_x = cx + (gx - cx) / zoom
        src_y = cy + (gy - cy) / zoom + shift
    elif motion == "drift-diagonal":
        zoom  = 1.0 + t * 0.07 + t * 0.04 * d
        shift = t * PARALLAX_PX * 0.4 * d
        src_x = cx + (gx - cx) / zoom - shift
        src_y = cy + (gy - cy) / zoom - shift * 0.6
    else:
        src_x = gx.copy()
        src_y = gy.copy()

    # Clamp to valid source range
    src_x = np.clip(src_x, 0, W - 1).astype(np.float32)
    src_y = np.clip(src_y, 0, H - 1).astype(np.float32)
    return src_x, src_y

# ── VIDEO WRITER ──────────────────────────────────────────────────────────────

def write_video(frames: list[np.ndarray], out_path: Path):
    import subprocess, tempfile
    tmp = out_path.with_suffix(".raw.mp4")
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    vw = cv2.VideoWriter(str(tmp), fourcc, FPS, (OUT_W, OUT_H))
    for f in frames:
        vw.write(f)
    vw.release()
    # Re-encode to H.264 so Chrome/Remotion can play it
    subprocess.run([
        "ffmpeg", "-y", "-i", str(tmp),
        "-c:v", "libx264", "-crf", "18", "-preset", "fast",
        "-pix_fmt", "yuv420p", str(out_path)
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    tmp.unlink()

# ── MAIN ──────────────────────────────────────────────────────────────────────

def run():
    proc, model = load_depth_model()
    print(f"\nDepth Parallax Generator — {len(SCENES)} scenes")
    print(f"{'='*52}\n")

    for scene in SCENES:
        out = OUT_DIR / f"{scene['id']}.mp4"
        img_path = IMG_DIR / scene["img"]

        if out.exists():
            print(f"SKIP  {scene['id']}  (exists)")
            continue

        if not img_path.exists():
            print(f"[!]   {scene['img']}  not found")
            continue

        print(f"Processing {scene['id']} ({scene['dur']}s, {scene['motion']})...")

        # Load + resize image to output dimensions
        img_bgr = cv2.imread(str(img_path))
        img_bgr = cv2.resize(img_bgr, (OUT_W, OUT_H), interpolation=cv2.INTER_LANCZOS4)
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

        # Estimate depth
        print("  Estimating depth...", end="", flush=True)
        depth = estimate_depth(proc, model, img_rgb)
        print(f"  done  (near={depth.max():.3f}  far={depth.min():.3f})")

        # Render frames
        n_frames = scene["dur"] * FPS
        frames = []
        for i in range(n_frames):
            t = i / (n_frames - 1)  # 0 → 1
            map_x, map_y = make_remap(depth, t, scene["motion"], OUT_W, OUT_H)
            warped = cv2.remap(img_bgr, map_x, map_y, cv2.INTER_LINEAR,
                               borderMode=cv2.BORDER_REPLICATE)
            frames.append(warped)

        write_video(frames, out)
        print(f"  OK  {out.name}  ({out.stat().st_size // 1024}KB)  [{n_frames} frames]")

    print(f"\n{'='*52}")
    print("Done. Copy videos to explainer-video/public/videos/ if not already there.")
    print(f"{'='*52}\n")

if __name__ == "__main__":
    run()
