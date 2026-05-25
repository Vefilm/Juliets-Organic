"""
Extract foreground layers from all 11 explainer images using rembg AI.
Saves PNG files (with transparency) to explainer-video/public/explainer-fg/
The background stays as-is in explainer-video/public/explainer/

Run: python extract_layers.py
"""

import io
from pathlib import Path
from PIL import Image
from rembg import remove, new_session

SRC_DIR = Path(r"C:\Users\vefil\Desktop\Rabbit Farm\assets\explainer")
OUT_DIR = Path(r"C:\Users\vefil\Desktop\Rabbit Farm\explainer-video\public\explainer-fg")

OUT_DIR.mkdir(parents=True, exist_ok=True)

# Use the u2net model — best balance of quality and speed for complex scenes
session = new_session("u2net")

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

print(f"\nParallax Layer Extraction — rembg u2net")
print(f"{'='*48}")
print(f"Source:  {SRC_DIR}")
print(f"Output:  {OUT_DIR}")
print(f"{'='*48}\n")

for img_name in IMAGES:
    src = SRC_DIR / img_name
    stem = Path(img_name).stem
    out = OUT_DIR / f"{stem}.png"

    if out.exists():
        print(f"  SKIP  {stem}.png  ({out.stat().st_size // 1024}KB)")
        continue

    if not src.exists():
        print(f"  [!]   {img_name}  not found")
        continue

    print(f"  Processing {stem}...", end="", flush=True)
    img = Image.open(src).convert("RGBA")
    result = remove(img, session=session, alpha_matting=True, alpha_matting_foreground_threshold=240, alpha_matting_background_threshold=10, alpha_matting_erode_size=10)
    result.save(out)
    kb = out.stat().st_size // 1024
    print(f"  OK  {kb}KB")

print(f"\n{'='*48}")
print(f"Done. Check explainer-video/public/explainer-fg/")
print(f"Open any PNG in GIMP to verify foreground extraction quality.")
print(f"{'='*48}\n")
