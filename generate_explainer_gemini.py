"""
Generate the 3 failed explainer shots using Gemini image generation.
Separate quota from Imagen 4 — runs independently.
Shots: 08_chef_plating, 09_family_table, 10_product_hero
"""

import io
from pathlib import Path
from google import genai
from google.genai import types
from PIL import Image

API_KEY       = "AIzaSyD4qAbRkHIV5b84zhbHJaEzCsq27SSlzb8"
OUT_DIR       = Path(r"C:\Users\vefil\Desktop\Rabbit Farm\assets\explainer")
MODEL_IMAGEN  = "imagen-4.0-generate-001"          # standard Imagen 4 — separate quota
MODEL_GEMINI  = "gemini-3.1-flash-image-preview"   # Gemini fallback

SHOTS = [
    {
        "id": "08_chef_plating",
        "prompt": (
            "Restaurant kitchen close-up, chef's hands in white apron using small tongs to "
            "place three thin slices of perfectly cooked rabbit saddle onto a large white "
            "ceramic plate. Minimalist fine-dining presentation — a smear of pale purée, "
            "micro herbs, one dot of dark sauce. Ambient restaurant bokeh background: warm "
            "amber candle flame and dark kitchen blur. Shallow depth of field, the food and "
            "hands sharp. 85mm macro lens aesthetic. Cinematic restaurant editorial "
            "photography, photorealistic, Michelin-star quality. No text."
        ),
    },
    {
        "id": "09_family_table",
        "prompt": (
            "Warm golden evening light streaming through a wooden-framed window onto a rustic "
            "Costa Rican farmhouse dining table. A whole roasted golden chicken at center, "
            "surrounded by side dishes and a carafe of wine. Steam rising gently from the "
            "food. A family of four seated around the table — shown from behind or in soft "
            "blur, no faces identifiable — in warm conversation. Warm amber and cream tones, "
            "candles visible on the table. Cinematic depth of field, wide 35mm lens. "
            "Photorealistic lifestyle photography, golden-hour warmth. No text."
        ),
    },
    {
        "id": "10_product_hero",
        "prompt": (
            "Dark moody product hero shot on polished black slate surface. Three vacuum-sealed "
            "meat packages arranged in a loose triangular layout — each with a clean matte "
            "black label with minimalist gold typography. A small sprig of fresh thyme, a "
            "halved garlic clove with papery skin, and a few peppercorns placed as accents. "
            "Single dramatic sidelight from the upper-left, creating deep directional shadows "
            "and bright highlights along the package edges. Near-black background. "
            "Premium editorial product photography, Michelin-star aesthetic, photorealistic. "
            "No text, no distractions."
        ),
    },
]


def gen_imagen(client, prompt, out):
    """Try standard Imagen 4 (separate daily quota from the fast variant)."""
    try:
        resp = client.models.generate_images(
            model=MODEL_IMAGEN,
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                output_mime_type="image/jpeg",
                aspect_ratio="4:3"
            )
        )
        for img_obj in resp.generated_images:
            img = Image.open(io.BytesIO(img_obj.image.image_bytes))
            img.save(out, quality=94)
            return True
        print("  [!] No image returned")
        return False
    except Exception as e:
        print(f"  [Imagen] {e}")
        return False


def gen_gemini(client, prompt, out):
    """Gemini image generation fallback."""
    try:
        resp = client.models.generate_content(
            model=MODEL_GEMINI,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"]
            )
        )
        for part in resp.candidates[0].content.parts:
            if part.inline_data is not None:
                img = Image.open(io.BytesIO(part.inline_data.data))
                img.save(out, quality=94)
                return True
        print("  [!] No image in response")
        return False
    except Exception as e:
        print(f"  [Gemini] {e}")
        return False


def gen(client, prompt, out):
    print("    trying Imagen 4 standard...")
    if gen_imagen(client, prompt, out):
        return True
    print("    falling back to Gemini...")
    return gen_gemini(client, prompt, out)


def run():
    client = genai.Client(api_key=API_KEY)
    ok, skip, fail = [], [], []

    for i, shot in enumerate(SHOTS):
        out = OUT_DIR / f"{shot['id']}.jpg"
        label = f"[{i+1}/{len(SHOTS)}] {shot['id']}"

        if out.exists():
            print(f"{label}  SKIP (exists, {out.stat().st_size // 1024}KB)")
            skip.append(shot['id'])
            continue

        print(f"{label}  generating via Gemini...")
        success = gen(client, shot['prompt'], out)

        if success:
            print(f"  OK  {out.name}  ({out.stat().st_size // 1024}KB)")
            ok.append(shot['id'])
        else:
            fail.append(shot['id'])

    print(f"\n{'='*52}")
    print(f"DONE  {len(ok)} generated  |  {len(skip)} skipped  |  {len(fail)} failed")
    if fail:
        print("Failed:")
        for f in fail:
            print(f"  - {f}")
    print("="*52)


if __name__ == "__main__":
    run()
