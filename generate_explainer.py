"""
Juliet's Organic Meats — Explainer Video Image Generation
10 images: aerial → animals → farm life → cold chain → table
"""

import io, time
from pathlib import Path
from google import genai
from google.genai import types
from PIL import Image

API_KEY   = "AIzaSyD4qAbRkHIV5b84zhbHJaEzCsq27SSlzb8"
OUT_DIR   = Path(r"C:\Users\vefil\Desktop\Rabbit Farm\assets\explainer")
MODEL     = "imagen-4.0-fast-generate-001"
DELAY     = 5

OUT_DIR.mkdir(parents=True, exist_ok=True)

SHOTS = [
    {
        "id": "01_aerial_farm",
        "ratio": "4:3",
        "prompt": (
            "Perfectly straight 90-degree top-down aerial drone photograph of a small organic "
            "farm carved into a Costa Rican tropical hillside, early morning. Lush dark green "
            "forest borders three sides of the farm. Three rectangular pastures visible — one "
            "with tiny white dots (free-range chickens and rabbits). A red corrugated tin roof "
            "farmhouse at the top left corner, narrow dirt paths between pasture sections. "
            "Wisps of white morning mist cling to the forest edge and low valleys. Overcast "
            "diffused soft light, no harsh shadows. Ultra-detailed satellite-quality drone "
            "photography, photorealistic, no CGI, hyper-real."
        ),
    },
    {
        "id": "02_rabbit_pov_running",
        "ratio": "16:9",
        "prompt": (
            "Extreme low ground-level POV shot, camera 3 inches off the earth, looking forward "
            "through a green Costa Rican pasture. The foreground is a shallow-focus blur of "
            "grass blades and white rabbit fur and paws in motion. Ahead in the middle distance, "
            "slightly soft, a flock of free-range white chickens pecking at the ground, and two "
            "Pekin ducks waddling to the right. Warm late-afternoon golden-hour light raking low "
            "across the grass, creating long fine shadows. Motion blur suggests speed. Cinematic "
            "35mm film aesthetic, photorealistic, no CGI."
        ),
    },
    {
        "id": "03_animals_sunset_portrait",
        "ratio": "16:9",
        "prompt": (
            "Majestic cinematic triptych-style portrait composition of three farm animals "
            "photographed together in a single wide frame, all at eye level, set against a "
            "dramatic Costa Rican mountain sunset. Left third: a white New Zealand White "
            "rabbit sitting upright, ears tall, eyes alert, fur backlit by warm amber sunset "
            "light creating a golden halo rim. Center: a white Pekin duck standing proud, "
            "orange bill visible, white feathers glowing amber from the setting sun behind. "
            "Right third: a heritage pasture-raised chicken standing tall, golden-brown "
            "feathers lit from behind. All three animals sharp and in focus. Behind them: "
            "rolling misty Costa Rican mountain ridgelines in deep silhouette, sky ablaze "
            "in layers of amber, deep orange, crimson, and indigo. Shallow depth of field "
            "on the mountain background only. Ultra-dramatic backlighting — inverse square "
            "law falloff, warm rim lights on each animal. Feels like a premium brand campaign "
            "image — National Geographic meets Michelin-star brand photography. "
            "Photorealistic, no CGI, cinematic 85mm lens."
        ),
    },
    {
        "id": "04_farm_establishing",
        "ratio": "16:9",
        "prompt": (
            "Wide cinematic establishing shot of a small organic farm in the Costa Rican "
            "highlands, late afternoon golden hour. Two modest farm buildings with weathered "
            "corrugated metal roofs sit in the center, surrounded by open green pastures. "
            "White rabbits and free-range chickens visible as small shapes in the fields. "
            "A dense tropical forest rises behind the farm. Misty blue-green mountain peaks "
            "in the far background. Warm amber and deep forest green tones. Cirrus clouds "
            "backlit by the setting sun. 24mm wide lens, cinematic depth, photorealistic "
            "farm photography, golden hour, no people."
        ),
    },
    {
        "id": "05_butcher_hands_vacuum",
        "ratio": "4:3",
        "prompt": (
            "Extreme close-up of skilled artisan hands in a clean white chef apron, carefully "
            "pressing the air from a clear vacuum bag containing a pale pink rabbit saddle "
            "portion on a clean stainless steel work surface. A vacuum sealing machine is "
            "partially visible at the edge of the frame. Warm amber sidelight from a window "
            "at the left, casting a soft directional shadow across the steel surface. "
            "Clinical precision meets craft warmth. No other people, just the hands, the "
            "meat, and the machine. Photorealistic, editorial butcher photography, no CGI."
        ),
    },
    {
        "id": "06_delivery_van_road",
        "ratio": "16:9",
        "prompt": (
            "A white refrigerated delivery van driving away from the camera on a narrow "
            "winding mountain road in Costa Rica, early morning. Dense tropical jungle on "
            "both sides of the road — ferns, palms, banana leaves. Blue-grey pre-dawn "
            "misty light, road surface slightly wet. The van has a small elegant gold text "
            "logo on the rear door. Cinematic wide shot, slight motion blur on the van "
            "conveying movement, the road curves left and disappears into green mist. "
            "Photorealistic, cinematic 24mm lens, no CGI."
        ),
    },
    {
        "id": "07_premium_unboxing",
        "ratio": "4:3",
        "prompt": (
            "Top-down flat lay on a dark charcoal slate surface. A premium matte black "
            "cardboard box is being opened, its lid folded back to reveal three vacuum-sealed "
            "meat portions — rabbit saddle, a duck breast, and chicken thighs — nestled in "
            "crisp white butcher paper with black tissue paper folds. A black wax seal "
            "broken on the lid. A small sprig of fresh rosemary in the corner. Single "
            "directional sidelight from the upper-left casting clean long shadows. "
            "Premium editorial food and product photography, photorealistic, "
            "Michelin-star unboxing aesthetic."
        ),
    },
    {
        "id": "08_chef_plating",
        "ratio": "3:4",
        "prompt": (
            "Restaurant kitchen close-up, chef's hands in white apron using small tongs to "
            "place three thin slices of perfectly cooked rabbit saddle onto a large white "
            "ceramic plate. Minimalist fine-dining presentation — a smear of pale purée, "
            "micro herbs, one dot of dark sauce. Ambient restaurant bokeh background: warm "
            "amber candle flame and dark kitchen blur. Shallow depth of field, the food and "
            "hands sharp. 85mm macro lens aesthetic. Cinematic restaurant editorial "
            "photography, photorealistic, Michelin-star quality."
        ),
    },
    {
        "id": "09_family_table",
        "ratio": "16:9",
        "prompt": (
            "Warm golden evening light streaming through a wooden-framed window onto a rustic "
            "Costa Rican farmhouse dining table. A whole roasted golden chicken at center, "
            "surrounded by side dishes and a carafe of wine. Steam rising gently from the "
            "food. A family of four seated around the table — shown from behind or in soft "
            "blur, no faces identifiable — in warm conversation. Warm amber and cream tones, "
            "candles visible on the table. Cinematic depth of field, wide 35mm lens. "
            "Photorealistic lifestyle photography, golden-hour warmth, no CGI."
        ),
    },
    {
        "id": "10_product_hero",
        "ratio": "4:3",
        "prompt": (
            "Dark moody product hero shot on polished black slate surface. Three vacuum-sealed "
            "meat packages arranged in a loose triangular layout — each with a clean matte "
            "black label with minimalist gold typography. A small sprig of fresh thyme, a "
            "halved garlic clove with papery skin, and a small gold coin placed as accents. "
            "Single dramatic sidelight from the upper-left, creating deep directional shadows "
            "and bright highlights along the package edges. Near-black background. "
            "Premium editorial product photography, Michelin-star aesthetic, photorealistic, "
            "no distractions."
        ),
    },
]


def gen(client, prompt, ratio, out):
    try:
        resp = client.models.generate_images(
            model=MODEL,
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                output_mime_type="image/jpeg",
                aspect_ratio=ratio
            )
        )
        for img_obj in resp.generated_images:
            img = Image.open(io.BytesIO(img_obj.image.image_bytes))
            img.save(out, quality=94)
            return True
        print("  [!] No image returned")
        return False
    except Exception as e:
        print(f"  [X] {e}")
        return False


def run():
    client = genai.Client(api_key=API_KEY)
    ok, skip, fail = [], [], []

    for i, shot in enumerate(SHOTS):
        out = OUT_DIR / f"{shot['id']}.jpg"
        label = f"[{i+1}/10] {shot['id']}"

        if out.exists():
            print(f"{label}  SKIP (exists, {out.stat().st_size//1024}KB)")
            skip.append(shot['id'])
            continue

        print(f"{label}  generating ({shot['ratio']})...")
        success = gen(client, shot['prompt'], shot['ratio'], out)

        if success:
            print(f"  OK  {out.name}  ({out.stat().st_size//1024}KB)")
            ok.append(shot['id'])
        else:
            fail.append(shot['id'])

        if i < len(SHOTS) - 1:
            time.sleep(DELAY)

    print(f"\n{'='*52}")
    print(f"DONE  {len(ok)} generated  |  {len(skip)} skipped  |  {len(fail)} failed")
    print(f"Output: {OUT_DIR}")
    if fail:
        print("\nFailed:")
        for f in fail:
            print(f"  - {f}")
    print("="*52)


if __name__ == "__main__":
    run()
