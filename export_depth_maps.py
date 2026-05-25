"""
Export depth maps for all 11 scenes — used by DepthParallaxCanvas in Remotion.
Run: py -3.10 export_depth_maps.py
Outputs: explainer-video/public/depth/*.png  (grayscale, white=near, black=far)
"""

import cv2
import numpy as np
import torch
from pathlib import Path
from PIL import Image
from transformers import AutoModelForDepthEstimation, AutoImageProcessor

IMG_DIR    = Path(r"C:\Users\vefil\Desktop\Rabbit Farm\assets\explainer")
OUT_DIR    = Path(r"C:\Users\vefil\Desktop\Rabbit Farm\explainer-video\public\depth")
OUT_W, OUT_H = 1920, 1080
DEPTH_MODEL  = "depth-anything/Depth-Anything-V2-Small-hf"

OUT_DIR.mkdir(parents=True, exist_ok=True)

IMAGES = [
    "01_aerial_farm.jpg",
    "02_rabbit_pov_running.jpg",
    "03_animals_sunset_portrait.jpg",
    "04_farm_establishing.jpg",
    "05_butcher_hands_vacuum.jpg",
    "06_delivery_van_road.jpg",
    "07_premium_unboxing.jpg",
    "08_chef_plating.jpg",
    "09_family_table.jpg",
    "10_product_hero.jpg",
    "11_logo_hero.jpg",
]

print("Loading Depth-Anything-V2-Small (cached)...")
proc  = AutoImageProcessor.from_pretrained(DEPTH_MODEL)
model = AutoModelForDepthEstimation.from_pretrained(DEPTH_MODEL)
model.eval()

print(f"\nExporting {len(IMAGES)} depth maps -> {OUT_DIR}\n")

for fname in IMAGES:
    stem     = Path(fname).stem
    out_path = OUT_DIR / f"{stem}.png"

    if out_path.exists():
        print(f"SKIP  {stem}  (exists)")
        continue

    img_path = IMG_DIR / fname
    if not img_path.exists():
        print(f"[!]  {fname} not found")
        continue

    print(f"  {stem}...", end="", flush=True)
    img_bgr = cv2.imread(str(img_path))
    img_bgr = cv2.resize(img_bgr, (OUT_W, OUT_H), interpolation=cv2.INTER_LANCZOS4)
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

    pil = Image.fromarray(img_rgb)
    inputs = proc(images=pil, return_tensors="pt")
    with torch.no_grad():
        out = model(**inputs).predicted_depth
    depth = torch.nn.functional.interpolate(
        out.unsqueeze(1),
        size=(OUT_H, OUT_W),
        mode="bicubic", align_corners=False,
    ).squeeze().numpy()
    depth = (depth - depth.min()) / (depth.max() - depth.min() + 1e-8)
    depth_u8 = (depth * 255).astype(np.uint8)

    cv2.imwrite(str(out_path), depth_u8)
    print(f"  saved ({out_path.name})")

print("\nAll depth maps exported.")
