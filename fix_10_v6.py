"""
Shot 10 — hero ingredient spread on dark marble, chiaroscuro lighting.
Real animal cuts + vegetables, no packaging.
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
    "Dramatic chiaroscuro editorial food photography on a dark veined marble surface. "
    "A premium ingredient spread arranged with painterly intentionality — like a Dutch "
    "Golden Age still life meets Michelin-star kitchen. Single strong directional light "
    "source from the upper-left, casting deep rich shadows across two-thirds of the "
    "frame. Bright highlights catch the wet sheen of the meat surfaces and the edge of "
    "the marble. "

    "MEATS — three raw proteins displayed naturally, not packaged: "
    "Left: a whole raw rabbit saddle — the elongated pale-pink loin still on the bone, "
    "lean and clean, recognizably rabbit in proportion. "
    "Center: a raw duck breast — large flat fillet, deeply dark red-purple meat with a "
    "thick ivory fat cap scored in a diamond crosshatch pattern, glistening. "
    "Right: a raw bone-in chicken leg quarter — golden skin draped over the thigh and "
    "drumstick, the joint visible. "

    "VEGETABLES scattered naturally around the meats: a halved head of garlic with "
    "papery skin peeling back, two or three small turnips with green tops still attached, "
    "a bundle of thin leeks, a few sprigs of fresh thyme and rosemary, two halved "
    "shallots showing concentric rings, a small pile of black peppercorns. "

    "The arrangement is organic and intentional — not a grid. Ingredients overlap "
    "slightly, casting shadows on each other. The marble surface has fine white veining "
    "on near-black background. 70% of the frame is in deep shadow; 30% catches the "
    "dramatic sidelight. "

    "16:9 wide format. 50mm lens flat-lay perspective slightly angled. "
    "Photorealistic. Premium food editorial photography — Saveur magazine meets "
    "Noma cookbook. No CGI. No packaging. No fake brands."
)

def main():
    client = genai.Client(api_key=API_KEY)
    out = OUT_DIR / "10_product_hero.jpg"

    print("generating shot 10 — marble chiaroscuro spread...")
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
