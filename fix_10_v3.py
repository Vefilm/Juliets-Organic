"""
Regenerate shot 10 — clean vacuum sealed bags, NO label boxes.
"""

import io
from pathlib import Path
from google import genai
from google.genai import types
from PIL import Image
import shutil

API_KEY  = "AIzaSyD4qAbRkHIV5b84zhbHJaEzCsq27SSlzb8"
MODEL_HD = "imagen-4.0-generate-001"
OUT_DIR  = Path(r"C:\Users\vefil\Desktop\Rabbit Farm\assets\explainer")
PUB_DIR  = Path(r"C:\Users\vefil\Desktop\Rabbit Farm\explainer-video\public\explainer")

PROMPT = (
    "Dark dramatic product photography on polished black slate. Three vacuum-sealed "
    "clear plastic bags arranged in a loose triangular layout on the slate surface. "
    "The bags are smooth clear plastic with NO labels, NO stickers, NO tags, NO black "
    "rectangles — just clean transparent vacuum-sealed plastic tightly wrapped around "
    "the meat inside. Bag one: whole rabbit leg and saddle — pale lean pink muscle meat "
    "with a clean bone end clearly visible through the plastic. Bag two: two large duck "
    "breasts — rich dark red-purple meat with a thick white fat cap, clearly visible. "
    "Bag three: two bone-in chicken thighs — golden skin and deep red muscle, clearly "
    "visible through the clear plastic. A sprig of fresh thyme and two halved garlic "
    "cloves scattered as garnish. Single dramatic sidelight from upper-left creating "
    "deep directional shadows and sharp highlights along the bag edges. Near-black "
    "background. Premium editorial product and food photography. Photorealistic. "
    "Absolutely NO labels, NO rectangular stickers, NO black boxes on any of the bags. "
    "The clear plastic showing real meat is the only packaging. No CGI."
)

def main():
    client = genai.Client(api_key=API_KEY)
    out = OUT_DIR / "10_product_hero.jpg"

    print("generating 10_product_hero.jpg (no labels)...")
    resp = client.models.generate_images(
        model=MODEL_HD,
        prompt=PROMPT,
        config=types.GenerateImagesConfig(
            number_of_images=1,
            output_mime_type="image/jpeg",
            aspect_ratio="4:3",
        ),
    )
    for img_obj in resp.generated_images:
        img = Image.open(io.BytesIO(img_obj.image.image_bytes))
        img.save(out, quality=94)
        shutil.copy2(out, PUB_DIR / out.name)
        print(f"saved + copied ({out.stat().st_size // 1024}KB)")

    print("Done.")

if __name__ == "__main__":
    main()
