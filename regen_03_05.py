"""
Regenerate images for scenes 03 and 05 with fresh approaches.
After this runs, delete old videos and re-run generate_videos.py for those two scenes.
"""

import io, shutil
from pathlib import Path
from google import genai
from google.genai import types
from PIL import Image

API_KEY  = "AIzaSyD4qAbRkHIV5b84zhbHJaEzCsq27SSlzb8"
MODEL    = "imagen-4.0-generate-001"
OUT_DIR  = Path(r"C:\Users\vefil\Desktop\Rabbit Farm\assets\explainer")
PUB_DIR  = Path(r"C:\Users\vefil\Desktop\Rabbit Farm\explainer-video\public\explainer")

SHOTS = [
    {
        "id": "03_animals_sunset_portrait",
        "ratio": "16:9",
        "prompt": (
            "Golden-hour farm photography, Costa Rica. A wide shallow-focus field shot at "
            "knee height. Three animals are naturally present in the same frame, each "
            "occupying their own visual space with room to breathe. "
            "Far left: a Dutch rabbit — compact body, distinctive black saddle markings on "
            "white fur, sitting alert in short grass. Warm amber rim light backlights the "
            "rabbit's fur. "
            "Center: a white Pekin duck standing in profile, orange bill, white feathers "
            "glowing gold from the setting sun behind. "
            "Right: a heritage Rhode Island Red chicken, rich copper-red plumage, standing "
            "naturally, feathers backlit. "
            "The background is a soft bokeh of lush green Costa Rican pasture and misty "
            "purple-blue mountains at golden hour. The lighting is warm, directional, "
            "cinematic — like a slow-motion nature documentary. "
            "Ultra-sharp animals, buttery soft background. No artificial set. No studio. "
            "Natural pasture environment. 85mm lens. Photorealistic. No CGI."
        ),
    },
    {
        "id": "05_butcher_hands_vacuum",
        "ratio": "4:3",
        "prompt": (
            "Artisan butcher workshop, Costa Rica. Wide overhead shot angled at 45 degrees "
            "looking down onto a clean stainless steel worktable. A skilled butcher in a "
            "clean white apron stands at the table. His hands hold a clear vacuum-sealed "
            "bag containing a pale pink rabbit saddle portion — the bag is sealed shut and "
            "the meat is clearly visible through the transparent plastic. The vacuum sealer "
            "machine sits to the right, partially in frame. On the table: two more sealed "
            "packages of duck breast and chicken thighs, neatly arranged. A warm amber "
            "window light from the left illuminates the workspace, casting clean shadows "
            "across the steel surface. The butcher's face is not visible — composition "
            "focuses on the hands and the products. "
            "Cinematic craft documentary photography. Photorealistic. Premium editorial "
            "butcher aesthetic. No CGI."
        ),
    },
]

def main():
    client = genai.Client(api_key=API_KEY)

    for shot in SHOTS:
        out = OUT_DIR / f"{shot['id']}.jpg"
        print(f"generating {shot['id']}...")
        resp = client.models.generate_images(
            model=MODEL,
            prompt=shot["prompt"],
            config=types.GenerateImagesConfig(
                number_of_images=1,
                output_mime_type="image/jpeg",
                aspect_ratio=shot["ratio"],
            ),
        )
        for img_obj in resp.generated_images:
            img = Image.open(io.BytesIO(img_obj.image.image_bytes))
            img.save(out, quality=94)
            shutil.copy2(out, PUB_DIR / out.name)
            print(f"  saved {out.name} ({out.stat().st_size // 1024}KB) -> also copied to Remotion")

    print("\nDone. Now delete old videos and re-run generate_videos.py for scenes 03 and 05.")

if __name__ == "__main__":
    main()
