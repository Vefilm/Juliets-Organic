"""
Shot 10 — simplified layout, rabbit shown as boneless saddle portions (not legs).
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
    "Top-down flat lay on a polished black slate surface. Three separate vacuum-sealed "
    "clear plastic bags placed side by side in a horizontal row, each containing only "
    "the meat described — nothing else inside the bags. "
    "Left bag: two boneless rabbit loin fillets — small pale pink oval-shaped boneless "
    "muscle pieces, smooth surface, no bones, no joints, no legs. "
    "Center bag: two duck breast fillets — flat oval portions, dark red meat on top with "
    "a thick white-yellow fat cap on the bottom half, no bones. "
    "Right bag: two boneless chicken thigh fillets — pale golden skin-on portions, "
    "soft irregular shape, no bones. "
    "All three bags: smooth clear transparent vacuum plastic, sealed edge visible, "
    "no labels, no stickers, nothing inside the bags except the meat. "
    "Between the bags on the slate: a few sprigs of fresh thyme only. "
    "Dramatic sidelight from the upper-left. Near-black background. "
    "Premium editorial product photography. Photorealistic. No CGI. "
    "No whole animals. No carcasses. No bones visible. Only boneless meat fillets."
)

def main():
    client = genai.Client(api_key=API_KEY)
    out = OUT_DIR / "10_product_hero.jpg"

    print("generating shot 10 v5 (boneless fillets, clean bags)...")
    resp = client.models.generate_images(
        model=MODEL_HD,
        prompt=PROMPT,
        config=types.GenerateImagesConfig(
            number_of_images=1,
            output_mime_type="image/jpeg",
            aspect_ratio="16:9",
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
