"""
Generate home family kitchen background image for Juliet's Organic Meats.
Mother + son at a cutting board, morning sunlight, modern kitchen.
"""

import io
from pathlib import Path
from google import genai
from google.genai import types
from PIL import Image

API_KEY = "AIzaSyD4qAbRkHIV5b84zhbHJaEzCsq27SSlzb8"
OUT = Path(r"C:\Users\vefil\Desktop\Rabbit Farm\assets\backgrounds\bg_home_family.jpg")

PROMPT = (
    "Warm premium lifestyle photography in a modern open-plan kitchen. "
    "A mother in her mid-30s and her young son age 8 stand together at a large "
    "light oak butcher-block island counter. The mother guides the boy's hands "
    "as he chops fresh herbs on a wooden cutting board — both laughing, relaxed, "
    "deeply connected. Beautiful warm golden morning light streams through a wide "
    "floor-to-ceiling window directly behind them, creating a luminous amber backlight "
    "that rims their silhouettes and fills the kitchen with warmth. "
    "The kitchen is modern and sleek: matte white cabinetry, pale natural stone counters, "
    "minimal stainless appliances. Fresh herbs, halved lemons, a whole raw chicken on "
    "the board nearby. Shallow depth of field — soft focus on the kitchen background, "
    "sharp on the hands and the cutting board. Wide 35mm lens. "
    "Photorealistic editorial lifestyle photography, Michelin-star brand warmth, "
    "no text, no logos, no packaging."
)

def run():
    if OUT.exists():
        print(f"SKIP — already exists ({OUT.stat().st_size // 1024}KB)")
        return
    client = genai.Client(api_key=API_KEY)
    print("Generating bg_home_family.jpg ...")
    try:
        resp = client.models.generate_images(
            model="imagen-4.0-fast-generate-001",
            prompt=PROMPT,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                output_mime_type="image/jpeg",
                aspect_ratio="16:9"
            )
        )
        for img_obj in resp.generated_images:
            img = Image.open(io.BytesIO(img_obj.image.image_bytes))
            img.save(OUT, quality=93)
            print(f"OK  {OUT.name}  ({OUT.stat().st_size // 1024}KB)")
            return
        print("[!] No image returned")
    except Exception as e:
        print(f"[X] {e}")

if __name__ == "__main__":
    run()
