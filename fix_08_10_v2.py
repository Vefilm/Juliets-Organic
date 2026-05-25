"""
Fix shot 08 (reframe to show plate + meat, not just utensils) and
strip logo compositing from shot 10 (clean product shot only).
"""

import io, time
from pathlib import Path
from google import genai
from google.genai import types
from PIL import Image

API_KEY  = "AIzaSyD4qAbRkHIV5b84zhbHJaEzCsq27SSlzb8"
MODEL_HD = "imagen-4.0-generate-001"
OUT_DIR  = Path(r"C:\Users\vefil\Desktop\Rabbit Farm\assets\explainer")
PUB_DIR  = Path(r"C:\Users\vefil\Desktop\Rabbit Farm\explainer-video\public\explainer")

SHOTS = [
    {
        "id": "08_chef_plating",
        "ratio": "16:9",
        "prompt": (
            "Michelin-star restaurant plating shot. A large white ceramic plate sits at the "
            "center of a dark stainless steel kitchen pass. On the plate: three perfectly "
            "sliced medallions of cooked rabbit saddle arranged in a gentle arc — pale, "
            "tender, lightly seared. Beside them a small smear of pale ivory cauliflower "
            "puree, three micro herb leaves, one dot of dark jus. A chef's hands in white "
            "apron cuffs enter from the top of the frame — left hand with fork, right hand "
            "with knife — positioned above the plate. The PLATE AND FOOD fill the lower "
            "two-thirds of the frame. Warm amber candlelight bokeh fills the background. "
            "16:9 wide format. Shallow depth of field — plate in sharp focus, background "
            "warm blur. Cinematic editorial food photography. Photorealistic. No CGI."
        ),
    },
    {
        "id": "10_product_hero",
        "ratio": "4:3",
        "prompt": (
            "Dark dramatic product photography on polished black slate surface. Three "
            "vacuum-sealed clear plastic bags arranged in a loose triangular layout. "
            "Each bag shows REAL raw premium meat clearly visible through the transparent "
            "clear plastic: one bag contains a whole rabbit leg and loin — pale lean pink "
            "muscle meat with clean bone end; one bag contains two large duck breasts — "
            "rich dark red meat with a thick white fat cap clearly visible; one bag contains "
            "two bone-in chicken thighs — golden skin and deep red muscle. Vacuum-sealed "
            "plastic wraps tightly against each cut. Each bag has a small plain matte black "
            "rectangular label area at its sealed top — no brand text, no logos. "
            "A sprig of fresh thyme and two halved garlic cloves as garnish. "
            "Single dramatic sidelight from upper-left, deep directional shadows, "
            "bright highlights along package edges. Premium editorial food photography. "
            "Photorealistic. The real meat is the hero. No fake brand names. No CGI."
        ),
    },
]


def gen(client, prompt, ratio, out_path):
    print(f"  generating {out_path.name}...")
    try:
        resp = client.models.generate_images(
            model=MODEL_HD,
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                output_mime_type="image/jpeg",
                aspect_ratio=ratio,
            ),
        )
        for img_obj in resp.generated_images:
            img = Image.open(io.BytesIO(img_obj.image.image_bytes))
            img.save(out_path, quality=94)
            print(f"  saved {out_path.name} ({out_path.stat().st_size // 1024}KB)")
            return True
    except Exception as e:
        print(f"  error: {e}")
    return False


def main():
    client = genai.Client(api_key=API_KEY)

    for i, shot in enumerate(SHOTS):
        out = OUT_DIR / f"{shot['id']}.jpg"
        ok = gen(client, shot["prompt"], shot["ratio"], out)
        if ok:
            # Copy to Remotion public folder
            import shutil
            shutil.copy2(out, PUB_DIR / out.name)
            print(f"  copied to Remotion public -> {out.name}")
        else:
            print(f"  FAILED {shot['id']}")

        if i < len(SHOTS) - 1:
            time.sleep(6)

    print("Done.")


if __name__ == "__main__":
    main()
