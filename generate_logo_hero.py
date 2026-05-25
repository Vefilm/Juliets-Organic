"""
Generate explainer video closing card — shot 11.
Dark cinematic brand hero: coin centered on deep slate, 16:9 for Veo.

Strategy:
  1. Generate a dark atmospheric background via Imagen 4 standard
  2. Composite the actual logo coin on top using PIL
  3. Output: assets/explainer/11_logo_hero.jpg
"""

import io
from pathlib import Path
from google import genai
from google.genai import types
from PIL import Image, ImageEnhance, ImageFilter

API_KEY  = "AIzaSyD4qAbRkHIV5b84zhbHJaEzCsq27SSlzb8"
OUT_DIR  = Path(r"C:\Users\vefil\Desktop\Rabbit Farm\assets\explainer")
COIN_SRC = Path(r"C:\Users\vefil\Desktop\Rabbit Farm\assets\Logo\logo_coin_clean.jpg")
OUT      = OUT_DIR / "11_logo_hero.jpg"
MODEL    = "imagen-4.0-generate-001"

BG_PROMPT = (
    "Ultra-dark cinematic background for a premium brand closing card, 16:9. "
    "Deep near-black polished dark slate surface, seen from directly above. "
    "A single dramatic spotlight from directly above illuminates the center of the frame "
    "— a soft warm circular pool of amber-gold light on the dark stone, fading to near-black "
    "at all four edges. No objects, no text, no people. Perfectly clean and empty. "
    "The surface has subtle natural stone texture visible only in the lit area. "
    "Photorealistic, editorial product photography background, Michelin-star aesthetic."
)

TARGET_W, TARGET_H = 1920, 1080  # 16:9 output


def gen_background(client):
    out = OUT_DIR / "_bg_temp.jpg"
    if out.exists():
        return Image.open(out)
    print("  Generating background...")
    resp = client.models.generate_images(
        model=MODEL,
        prompt=BG_PROMPT,
        config=types.GenerateImagesConfig(
            number_of_images=1,
            output_mime_type="image/jpeg",
            aspect_ratio="16:9"
        )
    )
    for img_obj in resp.generated_images:
        bg = Image.open(io.BytesIO(img_obj.image.image_bytes))
        bg.save(out, quality=96)
        print(f"  BG: {bg.size}")
        return bg
    raise RuntimeError("No background image returned")


def composite(bg: Image.Image, coin_path: Path) -> Image.Image:
    # Resize background to target
    bg = bg.resize((TARGET_W, TARGET_H), Image.LANCZOS)

    # Load coin and remove the dark surface surround by cropping to the coin itself
    coin = Image.open(coin_path).convert("RGBA")
    cw, ch = coin.size

    # Crop tighter — the coin occupies roughly the center 80% of the image
    margin_x = int(cw * 0.08)
    margin_y = int(ch * 0.08)
    coin = coin.crop((margin_x, margin_y, cw - margin_x, ch - margin_y))

    # Scale coin to ~38% of frame height (feels right for 1080p closing card)
    coin_h = int(TARGET_H * 0.58)
    coin_w = int(coin.width * (coin_h / coin.height))
    coin = coin.resize((coin_w, coin_h), Image.LANCZOS)

    # Create a circular mask for the coin
    mask = Image.new("L", (coin_w, coin_h), 0)
    from PIL import ImageDraw
    draw = ImageDraw.Draw(mask)
    # The coin is circular — draw filled ellipse as mask
    draw.ellipse((0, 0, coin_w - 1, coin_h - 1), fill=255)
    # Feather the edge slightly
    mask = mask.filter(ImageFilter.GaussianBlur(radius=4))

    # Center the coin in the frame
    x = (TARGET_W - coin_w) // 2
    y = (TARGET_H - coin_h) // 2 - int(TARGET_H * 0.03)  # slightly above center

    # Paste coin onto background using the circular mask
    bg = bg.convert("RGBA")
    bg.paste(coin, (x, y), mask)
    return bg.convert("RGB")


def run():
    if OUT.exists():
        print(f"SKIP — already exists ({OUT.stat().st_size // 1024}KB)")
        return

    client = genai.Client(api_key=API_KEY)

    try:
        bg = gen_background(client)
    except Exception as e:
        print(f"[X] Background generation failed: {e}")
        print("    Using solid dark fallback...")
        bg = Image.new("RGB", (TARGET_W, TARGET_H), (8, 6, 6))

    print("  Compositing coin...")
    result = composite(bg, COIN_SRC)
    result.save(OUT, quality=95)
    print(f"OK  {OUT.name}  ({OUT.stat().st_size // 1024}KB)")
    print(f"    Resolution: {result.size}")

    # Clean up temp bg
    temp = OUT_DIR / "_bg_temp.jpg"
    if temp.exists():
        temp.unlink()


if __name__ == "__main__":
    run()
