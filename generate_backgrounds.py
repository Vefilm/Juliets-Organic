"""
Juliet's Organic Meats — Section Background Image Generation
3 atmospheric dark images for Why Juliet's, Home Boxes, and FAQ sections.
"""

import io, time
from pathlib import Path
from google import genai
from google.genai import types
from PIL import Image

API_KEY = "AIzaSyD4qAbRkHIV5b84zhbHJaEzCsq27SSlzb8"
OUT_DIR = Path(r"C:\Users\vefil\Desktop\Rabbit Farm\assets\backgrounds")
MODEL   = "imagen-4.0-fast-generate-001"
DELAY   = 5

OUT_DIR.mkdir(parents=True, exist_ok=True)

SHOTS = [
    {
        "id": "bg_why_kitchen",
        "ratio": "16:9",
        "prompt": (
            "Dark, ultra-atmospheric wide shot of a professional restaurant kitchen at late-night "
            "service. A lone chef stands at a gas range in the deep background — silhouetted in "
            "warm amber and orange light from open gas flames beneath a pan. Steam rises in soft "
            "columns catching the backlight. Foreground: a dark stainless steel prep surface, "
            "slightly out of focus. Stone or concrete walls, very dark. The image is 80% shadow "
            "with concentrated pools of warm amber light. No faces. No logos. No text. "
            "Photorealistic editorial kitchen photography, cinematic 24mm, deep moody atmosphere, "
            "inverse square law lighting, no CGI."
        ),
    },
    {
        "id": "bg_boxes_cuts",
        "ratio": "16:9",
        "prompt": (
            "Dark moody overhead editorial photograph on very dark charcoal slate surface. "
            "Three premium raw meat cuts arranged loosely — a pale pink rabbit saddle, a duck "
            "breast with scored diamond-pattern skin, and golden-skinned chicken thighs — "
            "surrounded by loose fresh thyme sprigs, coarse sea salt crystals, and two halved "
            "garlic heads with papery skin. Single dramatic warm amber sidelight from the upper "
            "left, deep directional shadows occupying 70% of the frame. Near-black background. "
            "Michelin-star raw product editorial photography, photorealistic, no people, no text, "
            "no packaging."
        ),
    },
    {
        "id": "bg_faq_herbs",
        "ratio": "16:9",
        "prompt": (
            "Dark close-up overhead flatlay on aged dark walnut or slate. A generous loose "
            "arrangement of whole fresh culinary herbs — thick sprigs of rosemary, flat-leaf "
            "parsley, tarragon, bay leaves — scattered naturally across the frame. Among them: "
            "whole black peppercorns, coarse fleur de sel, a few dried chili flakes catching "
            "the light, two halved lemons showing their cross-section. Single directional "
            "sidelight from the left, deep rich shadows, crisp highlights on the herb textures. "
            "Image is predominantly dark with warm amber accent tones. "
            "Premium culinary editorial photography, photorealistic, Michelin aesthetic, "
            "no people, no text, no plates."
        ),
    },
]


def gen(client, prompt, ratio, out):
    try:
        resp = client.models.generate_images(
            model=MODEL,
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                output_mime_type="image/jpeg",
                aspect_ratio=ratio
            )
        )
        for img_obj in resp.generated_images:
            img = Image.open(io.BytesIO(img_obj.image.image_bytes))
            img.save(out, quality=93)
            return True
        print("  [!] No image returned")
        return False
    except Exception as e:
        print(f"  [X] {e}")
        return False


def run():
    client = genai.Client(api_key=API_KEY)
    ok, skip, fail = [], [], []

    for i, shot in enumerate(SHOTS):
        out = OUT_DIR / f"{shot['id']}.jpg"
        label = f"[{i+1}/{len(SHOTS)}] {shot['id']}"

        if out.exists():
            print(f"{label}  SKIP (exists, {out.stat().st_size//1024}KB)")
            skip.append(shot['id'])
            continue

        print(f"{label}  generating ({shot['ratio']})...")
        success = gen(client, shot['prompt'], shot['ratio'], out)

        if success:
            print(f"  OK  {out.name}  ({out.stat().st_size//1024}KB)")
            ok.append(shot['id'])
        else:
            fail.append(shot['id'])

        if i < len(SHOTS) - 1:
            time.sleep(DELAY)

    print(f"\n{'='*52}")
    print(f"DONE  {len(ok)} generated  |  {len(skip)} skipped  |  {len(fail)} failed")
    if fail:
        print("Failed:")
        for f in fail:
            print(f"  - {f}")
    print("="*52)


if __name__ == "__main__":
    run()
