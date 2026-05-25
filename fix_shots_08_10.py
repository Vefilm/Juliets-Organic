"""
Regenerate shots 08 (chef plating - fix utensils) and 10 (product hero - real meat + logo).
Shot 03 already done in fix_shots.py run.
"""

import io, time
from pathlib import Path
from google import genai
from google.genai import types
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

API_KEY  = "AIzaSyD4qAbRkHIV5b84zhbHJaEzCsq27SSlzb8"
MODEL_HD = "imagen-4.0-generate-001"
OUT_DIR  = Path(r"C:\Users\vefil\Desktop\Rabbit Farm\assets\explainer")
LOGO     = Path(r"C:\Users\vefil\Desktop\Rabbit Farm\assets\Logo\logo_coin_clean.jpg")
DELAY    = 6

SHOTS = [
    {
        "id": "08_chef_plating",
        "ratio": "3:4",
        "prompt": (
            "Restaurant kitchen close-up. A chef in a clean white apron is plating a dish. "
            "LEFT HAND: firmly holds a standard silver four-tine dinner fork with tines "
            "pointing down to steady a slice of cooked rabbit saddle on a large white ceramic plate. "
            "RIGHT HAND: holding a clean silver dinner knife with a full blade, using it to "
            "guide and position the meat. Both hands clearly visible in frame — a fork in the "
            "left, a knife in the right. Minimalist fine-dining presentation: pale cream puree "
            "smear, micro herbs scattered, one small dot of dark sauce. Warm amber bokeh "
            "candle background. Shallow depth of field — hands and food sharp, background "
            "blurred. 85mm macro lens. Michelin-star restaurant editorial photography, "
            "photorealistic, no CGI."
        ),
    },
    {
        "id": "10_product_hero_base",
        "ratio": "4:3",
        "prompt": (
            "Dark dramatic product photography on polished black slate surface. Three "
            "vacuum-sealed clear plastic bags arranged in a loose triangular layout. "
            "Each bag shows REAL raw premium meat clearly visible through the transparent "
            "clear plastic: one bag contains a whole rabbit leg and saddle — pale lean pink "
            "muscle meat with clean bone; one bag contains two large duck breasts — rich dark "
            "red meat with a thick white fat cap on one side; one bag contains two bone-in "
            "chicken thighs — golden skin and dark red muscle. The vacuum-sealed plastic "
            "wraps tightly against each cut showing its natural shape. Each bag has a small "
            "plain matte black rectangular label area at its sealed top edge — no brand "
            "text visible. A sprig of fresh thyme and two halved garlic cloves as accents. "
            "Single dramatic sidelight from upper-left. Deep directional shadows. Premium "
            "editorial food photography. Photorealistic. Clear plastic — real meat is the "
            "hero. No fake brand names anywhere. No CGI."
        ),
    },
]


def gen_image(client, prompt, ratio, out_path):
    print(f"  generating {out_path.name}...")
    try:
        resp = client.models.generate_images(
            model=MODEL_HD,
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                output_mime_type="image/jpeg",
                aspect_ratio=ratio
            )
        )
        for img_obj in resp.generated_images:
            img = Image.open(io.BytesIO(img_obj.image.image_bytes))
            img.save(out_path, quality=94)
            print(f"  saved {out_path.name} ({out_path.stat().st_size // 1024}KB)")
            return True
    except Exception as e:
        print(f"  error: {e}")
    return False


def composite_logo(base_path, logo_path, out_path):
    base = Image.open(base_path).convert("RGB")
    coin = Image.open(logo_path).convert("RGBA")
    W, H = base.size
    print(f"  compositing logo ({W}x{H})...")

    diam = int(W * 0.11)
    coin = coin.resize((diam, diam), Image.LANCZOS)

    mask = Image.new("L", (diam, diam), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((2, 2, diam - 3, diam - 3), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=3))

    coin_rgba = coin.copy()
    enhancer = ImageEnhance.Brightness(coin_rgba)
    coin_rgba = enhancer.enhance(0.88)

    positions = [
        (int(W * 0.22), int(H * 0.18)),
        (int(W * 0.53), int(H * 0.08)),
        (int(W * 0.72), int(H * 0.38)),
    ]

    result = base.copy()
    for (cx, cy) in positions:
        x = cx - diam // 2
        y = cy - diam // 2
        result.paste(coin_rgba, (x, y), mask)

    result.save(out_path, quality=94)
    print(f"  composited -> {out_path.name} ({out_path.stat().st_size // 1024}KB)")


def main():
    client = genai.Client(api_key=API_KEY)

    for i, shot in enumerate(SHOTS):
        out = OUT_DIR / f"{shot['id']}.jpg"
        success = gen_image(client, shot["prompt"], shot["ratio"], out)

        if not success:
            print(f"  FAILED {shot['id']}")

        if success and shot["id"] == "10_product_hero_base":
            final = OUT_DIR / "10_product_hero.jpg"
            composite_logo(out, LOGO, final)
            out.unlink()
            print(f"  OK 10_product_hero.jpg")

        if i < len(SHOTS) - 1:
            time.sleep(DELAY)

    print("Done.")


if __name__ == "__main__":
    main()
