"""
Juliet's Organic Meats - Asset Generation Pipeline
Manifest-driven, style-locked image generation.

Requirements:
  pip install google-genai pillow

Usage:
  python generate_assets.py [--category anatomy|farm|product|recipes|boxes|lifestyle|maps]

Billing note:
  All image models (Imagen 4, Gemini 3 Pro Image) require a paid Google AI Studio plan.
  Add billing at: https://aistudio.google.com → Settings → Billing
  Then rotate your API key at: https://aistudio.google.com/apikey
"""

import io
import json
import sys
import time
import argparse
from pathlib import Path
from google import genai
from google.genai import types
from PIL import Image

# ── CONFIG ────────────────────────────────────────────────────────────────────
API_KEY      = "AIzaSyD4qAbRkHIV5b84zhbHJaEzCsq27SSlzb8"  # ROTATE after use
OUTPUT_DIR   = Path(r"C:\Users\vefil\Desktop\Rabbit Farm\assets")
MANIFEST     = Path(r"C:\Users\vefil\Desktop\Rabbit Farm\manifest.json")
LOG_FILE     = OUTPUT_DIR / "_generation_log.json"

# Best model for each category.
# Anatomy illustrations: gemini-3-pro-image-preview (handles style conditioning well)
# All others: imagen-4.0-fast-generate-001 (cheapest, ~$0.02/img, photorealistic)
MODEL_PHOTO  = "imagen-4.0-fast-generate-001"
MODEL_ILLUS  = "gemini-3-pro-image-preview"

DELAY        = 4   # seconds between calls — stay under RPM limits

# ── CATEGORY MAP ──────────────────────────────────────────────────────────────
# Maps argparse --category flag to manifest keys
CATEGORY_MAP = {
    "anatomy":   "anatomy_illustrations",
    "farm":      "farm_photography",
    "product":   "product_photography",
    "recipes":   "recipe_photography",
    "boxes":     "subscription_boxes",
    "lifestyle": "lifestyle_photography",
    "maps":      "maps",
    "sequence":  "farm_to_table",
    "breeds":    "breeds",
}

# ── SETUP ─────────────────────────────────────────────────────────────────────
def setup():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for sub in ["illustrations","farm","product","recipes","boxes","lifestyle","maps","sequence","breeds"]:
        (OUTPUT_DIR / sub).mkdir(exist_ok=True)

# ── IMAGE GENERATION — PHOTO (Imagen 4) ──────────────────────────────────────
def gen_photo(client, prompt: str, out: Path) -> bool:
    try:
        response = client.models.generate_images(
            model=MODEL_PHOTO,
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                output_mime_type="image/jpeg",
                aspect_ratio="4:3"
            )
        )
        for img_obj in response.generated_images:
            img = Image.open(io.BytesIO(img_obj.image.image_bytes))
            img.save(out, quality=92)
            return True
        print("  [!] No image in response")
        return False
    except Exception as e:
        print(f"  [X] {e}")
        return False

# ── IMAGE GENERATION — ILLUSTRATION (Gemini 3 Pro, style-conditioned) ────────
def gen_illustration(client, prompt: str, out: Path, style_block: str, ref_image_path: Path = None) -> bool:
    try:
        # Build full prompt with style block prefix
        full_prompt = f"{style_block}\n\n{prompt}"

        if ref_image_path and ref_image_path.exists():
            # Load reference image as bytes for conditioning
            with open(ref_image_path, "rb") as f:
                ref_bytes = f.read()
            contents = [
                types.Part.from_text(text=full_prompt),
                types.Part.from_bytes(data=ref_bytes, mime_type="image/png")
            ]
        else:
            contents = full_prompt

        response = client.models.generate_content(
            model=MODEL_ILLUS,
            contents=contents,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"]
            )
        )
        for part in response.candidates[0].content.parts:
            if part.inline_data is not None:
                img = Image.open(io.BytesIO(part.inline_data.data))
                img.save(out)
                return True
        print("  [!] No image in response (content filter?)")
        return False
    except Exception as e:
        print(f"  [X] {e}")
        return False

# ── MAIN ──────────────────────────────────────────────────────────────────────
def run(category_filter: str = None):
    setup()

    with open(MANIFEST) as f:
        manifest = json.load(f)

    style_block = manifest["style_block"]
    client = genai.Client(api_key=API_KEY)

    # Determine which categories to process
    if category_filter:
        keys = [CATEGORY_MAP[category_filter]]
    else:
        keys = list(CATEGORY_MAP.values())

    log = {"generated": [], "failed": [], "skipped": []}

    # Use Pedro's reference rabbit image as initial style anchor for anatomy series.
    # Chain: Pedro_ref -> rabbit (is_master) -> master_ref updated -> duck conditioned on rabbit -> chicken conditioned on rabbit
    PEDRO_STYLE_REF = OUTPUT_DIR / "illustrations" / "Gemini_Generated_Image_gau7gcgau7gcgau7.png"
    master_ref = PEDRO_STYLE_REF if PEDRO_STYLE_REF.exists() else None

    for key in keys:
        if key not in manifest:
            continue
        assets = manifest[key]
        is_anatomy = (key == "anatomy_illustrations")

        print(f"\n[{key.upper()}] {len(assets)} assets")
        print("-" * 50)

        for i, asset in enumerate(assets):
            out = OUTPUT_DIR / asset["output"]
            label = f"[{i+1}/{len(assets)}] {asset['id']}"

            if out.exists():
                print(f"{label} SKIP (exists)")
                log["skipped"].append(asset["id"])
                # If this is the master and we skipped it, still set the ref path
                if is_anatomy and asset.get("is_master"):
                    master_ref = out
                continue

            print(f"{label} generating...")

            if is_anatomy:
                ref = master_ref  # always condition on the current ref (Pedro's style or previously generated master)
                success = gen_illustration(client, asset["prompt"], out, style_block, ref)
                if success and asset.get("is_master"):
                    master_ref = out  # Lock in the master for subsequent illustrations
            else:
                success = gen_photo(client, asset["prompt"], out)

            if success:
                size = out.stat().st_size // 1024
                print(f"  OK  {out.name} ({size}KB)")
                log["generated"].append(asset["id"])
            else:
                print(f"  FAIL  {asset['id']}")
                log["failed"].append({"id": asset["id"], "prompt": asset["prompt"][:80]})

            # Save incremental log
            with open(LOG_FILE, "w") as f:
                json.dump(log, f, indent=2)

            if i < len(assets) - 1:
                time.sleep(DELAY)

    # Summary
    total = len(log["generated"]) + len(log["failed"]) + len(log["skipped"])
    print(f"\n{'='*50}")
    print(f"DONE  {len(log['generated'])} generated  |  {len(log['skipped'])} skipped  |  {len(log['failed'])} failed")
    print(f"Assets: {OUTPUT_DIR}")
    if log["failed"]:
        print("\nFailed (fallback to MidJourney):")
        for item in log["failed"]:
            print(f"  - {item['id']}")
    print("="*50)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Juliet's Organic Meats — asset generator")
    parser.add_argument(
        "--category",
        choices=list(CATEGORY_MAP.keys()),
        help="Generate only one category (default: all)"
    )
    args = parser.parse_args()
    run(args.category)
