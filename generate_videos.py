"""
Juliet's Organic Meats — Explainer Video Generation
Batch animates all 11 explainer images via Veo 2 image-to-video API.
Outputs MP4s to assets/videos/ for use in Remotion assembly.

Run: python generate_videos.py
Each video takes ~2-3 min to generate. Total: ~25-35 min.
Already-generated videos are skipped automatically.
"""

import io
import time
from pathlib import Path
from google import genai
from google.genai import types

API_KEY  = "AIzaSyD4qAbRkHIV5b84zhbHJaEzCsq27SSlzb8"
IMG_DIR  = Path(r"C:\Users\vefil\Desktop\Rabbit Farm\assets\explainer")
OUT_DIR  = Path(r"C:\Users\vefil\Desktop\Rabbit Farm\assets\videos")
MODEL    = "veo-2.0-generate-001"
POLL_SEC = 30   # seconds between status checks

OUT_DIR.mkdir(parents=True, exist_ok=True)

# ── SCENE DEFINITIONS ──────────────────────────────────────────────────────────
# Each entry: image filename → Veo motion prompt + duration
SCENES = [
    {
        "id": "01_aerial_farm",
        "img": "01_aerial_farm.jpg",
        "duration": 6,
        "prompt": (
            "Slow clockwise rotation from directly overhead, maintaining a perfect top-down "
            "perspective. The tiny white dots of chickens and rabbits drift slightly across "
            "the green pastures. Morning mist lifts slowly from the forest edge. Camera holds "
            "altitude throughout. No camera shake. Ultra smooth, almost imperceptible motion."
        ),
    },
    {
        "id": "02_rabbit_pov_running",
        "img": "02_rabbit_pov_running.jpg",
        "duration": 6,
        "prompt": (
            "Forward motion at extreme ground level, pushing slowly through the grass. "
            "Foreground grass blades drift past in soft blur. In the middle distance the "
            "chickens and ducks shift position — one duck waddles left. Warm golden-hour "
            "light flickers through the grass. Subtle motion blur on the frame edges."
        ),
    },
    {
        "id": "03_animals_sunset_portrait",
        "img": "03_animals_sunset_portrait.jpg",
        "duration": 7,
        "prompt": (
            "Ultra-slow push-in toward the three animals over 7 seconds. Fur and feathers "
            "respond to a gentle breeze — rabbit ears flick slightly, duck feathers ruffle "
            "once. A warm lens flare from the setting sun creeps in from the upper right and "
            "holds. The mountain silhouette deepens in color. Nearly imperceptible dolly forward."
        ),
    },
    {
        "id": "04_farm_establishing",
        "img": "04_farm_establishing.jpg",
        "duration": 6,
        "prompt": (
            "Wide slow push-in from the left edge toward the center farmhouse. A thin wisp "
            "of smoke rises from the chimney. White animal shapes in the pasture move lazily. "
            "Cirrus clouds drift slowly right. The amber light on the corrugated rooftop warms "
            "gradually. Camera holds before reaching the building."
        ),
    },
    {
        "id": "05_butcher_hands_vacuum",
        "img": "05_butcher_hands_vacuum.jpg",
        "duration": 6,
        "prompt": (
            "Extreme close-up. Hands complete the pressing motion — the clear plastic bag "
            "seals around the pale pink meat. A fine condensation mist forms briefly on the "
            "bag surface. Camera holds still. A single bead of moisture rolls down the "
            "stainless steel counter. Very slow 2cm push-in over 6 seconds."
        ),
    },
    {
        "id": "06_delivery_van_road",
        "img": "06_delivery_van_road.jpg",
        "duration": 7,
        "prompt": (
            "Smooth tracking shot — the camera follows the white refrigerated delivery van "
            "from behind as it drives at a steady pace down the narrow winding mountain road. "
            "The camera maintains the same distance from the van throughout, moving with it "
            "as it curves left through the dense Costa Rican jungle. Ferns and palm leaves "
            "blur past on both sides. The van's rear logo catches morning light. The road "
            "curves and the camera follows smoothly around the bend into the green mist. "
            "Cinematic car-following tracking shot, steady and fluid, no shake."
        ),
    },
    {
        "id": "07_premium_unboxing",
        "img": "07_premium_unboxing.jpg",
        "duration": 6,
        "prompt": (
            "Top-down, perfectly still camera. The tissue paper inside the box settles slowly "
            "as if just placed. A very gentle ambient light shift — the gold seal on the lid "
            "catches a highlight that moves slightly. The rosemary sprig quivers once. "
            "Ultra slow push-in from above, 3cm over 6 seconds."
        ),
    },
    {
        "id": "08_chef_plating",
        "img": "08_chef_plating.jpg",
        "duration": 6,
        "prompt": (
            "Macro push-in onto the white ceramic plate. A micro curl of steam rises from "
            "the warm meat and dissipates upward. The amber candle flame in the background "
            "wavers once. Camera holds shallow focus on the food throughout. Extremely slow "
            "push-in, nearly imperceptible."
        ),
    },
    {
        "id": "09_family_table",
        "img": "09_family_table.jpg",
        "duration": 7,
        "prompt": (
            "Slow push-in through the warm window light toward the table. Steam rises in soft "
            "columns from the roasted chicken and dissipates. The family figures in the "
            "background lean together — soft blur, no faces. Candle flames flicker once. "
            "Golden light on the tablecloth deepens slightly as the camera moves."
        ),
    },
    {
        "id": "10_product_hero",
        "img": "10_product_hero.jpg",
        "duration": 6,
        "prompt": (
            "Extremely slow top-down push-in toward the center of the marble ingredient "
            "spread over 6 seconds. The sidelight creates a subtle shifting highlight "
            "across the marble veining. The thyme sprigs tremble once from an imperceptible "
            "air movement. The dark marble surface catches a slow warm light breath. "
            "Camera holds true overhead perspective throughout."
        ),
    },
    {
        "id": "11_logo_hero",
        "img": "11_logo_hero.jpg",
        "duration": 8,
        "prompt": (
            "Begin slightly closer — coin fills 70 percent of frame. Ultra slow pull-back "
            "over 7 seconds to reveal full 16:9 composition with deep dark negative space "
            "on all sides. The warm amber spotlight behind the coin intensifies subtly as "
            "the camera pulls back. Coin remains perfectly still. Hold on the final wide "
            "frame for 1 second before natural end."
        ),
    },
]


# ── GENERATION ─────────────────────────────────────────────────────────────────

def generate_video(client, scene):
    img_path = IMG_DIR / scene["img"]
    out_path = OUT_DIR / f"{scene['id']}.mp4"

    if out_path.exists():
        print(f"  SKIP — {out_path.name} already exists ({out_path.stat().st_size // 1024}KB)")
        return True

    if not img_path.exists():
        print(f"  [!] Image not found: {img_path.name}")
        return False

    with open(img_path, "rb") as f:
        img_bytes = f.read()

    print(f"  Submitting to Veo...")
    try:
        operation = client.models.generate_videos(
            model=MODEL,
            prompt=scene["prompt"],
            image=types.Image(
                image_bytes=img_bytes,
                mime_type="image/jpeg"
            ),
            config=types.GenerateVideosConfig(
                duration_seconds=scene["duration"],
                aspect_ratio="16:9",
                number_of_videos=1,
            )
        )
    except Exception as e:
        print(f"  [X] Submit failed: {e}")
        return False

    # Poll for completion
    print(f"  Waiting for Veo (this takes 2-5 min)...")
    elapsed = 0
    while not operation.done:
        time.sleep(POLL_SEC)
        elapsed += POLL_SEC
        try:
            operation = client.operations.get(operation)
        except Exception as e:
            print(f"  [!] Poll error: {e}")
            break
        print(f"    {elapsed}s elapsed...")

    if not operation.done:
        print(f"  [X] Operation timed out or failed")
        return False

    # Download video
    if not operation.response.generated_videos:
        print(f"  [!] No video in response")
        return False

    vid = operation.response.generated_videos[0]

    # Method 1: SDK returns bytes directly (newer SDK)
    try:
        video_bytes = client.files.download(file=vid.video)
        with open(out_path, "wb") as f:
            f.write(video_bytes)
        print(f"  OK  {out_path.name}  ({out_path.stat().st_size // 1024}KB)")
        return True
    except Exception as e1:
        print(f"  [!] SDK download failed: {e1}")

    # Method 2: requests with API key header
    try:
        import requests
        video_uri = vid.video.uri
        resp = requests.get(
            video_uri,
            headers={"x-goog-api-key": API_KEY},
            stream=True,
            timeout=120,
        )
        resp.raise_for_status()
        with open(out_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=65536):
                f.write(chunk)
        print(f"  OK  {out_path.name} (requests+header) ({out_path.stat().st_size // 1024}KB)")
        return True
    except Exception as e2:
        print(f"  [!] requests header download failed: {e2}")

    # Method 3: requests with API key as query param
    try:
        import requests
        video_uri = vid.video.uri
        sep = "&" if "?" in video_uri else "?"
        resp = requests.get(
            f"{video_uri}{sep}key={API_KEY}",
            stream=True,
            timeout=120,
        )
        resp.raise_for_status()
        with open(out_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=65536):
                f.write(chunk)
        print(f"  OK  {out_path.name} (requests+key) ({out_path.stat().st_size // 1024}KB)")
        return True
    except Exception as e3:
        print(f"  [X] All download methods failed: {e3}")
        return False


def run():
    client = genai.Client(api_key=API_KEY)
    ok, skip, fail = [], [], []

    print(f"\nJuliet's Explainer — Veo Batch Generation")
    print(f"{'='*52}")
    print(f"Model: {MODEL}")
    print(f"Scenes: {len(SCENES)}")
    print(f"Output: {OUT_DIR}")
    print(f"{'='*52}\n")

    for i, scene in enumerate(SCENES):
        label = f"[{i+1}/{len(SCENES)}] {scene['id']}"
        print(f"\n{label}")

        out = OUT_DIR / f"{scene['id']}.mp4"
        if out.exists():
            skip.append(scene['id'])
            print(f"  SKIP (exists)")
            continue

        success = generate_video(client, scene)

        if success:
            ok.append(scene['id'])
        else:
            fail.append(scene['id'])

    print(f"\n{'='*52}")
    print(f"DONE  {len(ok)} generated  |  {len(skip)} skipped  |  {len(fail)} failed")
    if fail:
        print("Failed:")
        for f in fail:
            print(f"  - {f}")
    print(f"{'='*52}")


if __name__ == "__main__":
    run()
