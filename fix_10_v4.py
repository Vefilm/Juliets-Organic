"""
Regenerate shot 10 — fix rabbit package to show butchered cuts, not whole carcass.
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
    "clear plastic bags arranged in a loose triangular layout. NO whole animal bodies. "
    "NO full carcasses. Only individual portioned butcher cuts. "
    "Bag one (left): two raw rabbit hind legs — individual separated leg portions, "
    "pale lean pink muscle meat, clean cut ends with small bone cross-sections. "
    "These are small individual pieces, not a whole rabbit. "
    "Bag two (top right): two large raw duck breast fillets — individual flat oval "
    "portions with rich dark red-purple meat on one side and a thick creamy white "
    "fat cap on the other side. Clean flat butcher cuts. "
    "Bag three (bottom right): two raw bone-in chicken thighs — skin-on portions "
    "with golden skin and dark red meat, clean portioned cuts. "
    "All bags are smooth clear transparent vacuum-sealed plastic, no labels, no stickers. "
    "A sprig of fresh thyme and two halved garlic cloves as garnish on the slate. "
    "Single dramatic sidelight from upper-left, deep shadows, sharp highlights on "
    "bag edges. Near-black background. Premium editorial product photography. "
    "Photorealistic. Individual butcher cuts only — absolutely no whole animal carcasses. No CGI."
)

def main():
    client = genai.Client(api_key=API_KEY)
    out = OUT_DIR / "10_product_hero.jpg"

    print("generating 10_product_hero.jpg (portioned cuts, no carcasses)...")
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
        kb = out.stat().st_size // 1024
        print(f"saved + copied ({kb}KB)")

    print("Done.")

if __name__ == "__main__":
    main()
