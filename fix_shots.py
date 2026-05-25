"""
Fix three explainer shots:
  03 — replace white rabbit with Dutch/Californian patched rabbit
  08 — chef right hand holds a proper dinner knife (not fork+weird object)
  10 — real vacuum-sealed meat, then composite Juliet's logo coin onto packaging
"""

import io, time
from pathlib import Path
from google import genai
from google.genai import types
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

API_KEY  = "AIzaSyD4qAbRkHIV5b84zhbHJaEzCsq27SSlzb8"
MODEL    = "imagen-4.0-fast-generate-001"
MODEL_HD = "imagen-4.0-generate-001"
OUT_DIR  = Path(r"C:\Users\vefil\Desktop\Rabbit Farm\assets\explainer")
LOGO     = Path(r"C:\Users\vefil\Desktop\Rabbit Farm\assets\Logo\logo_coin_clean.jpg")
DELAY    = 6

SHOTS = [
    # 03 already regenerated — skip
    # {
    #     "id": "03_animals_sunset_portrait",
    {
        "id": "03_animals_sunset_portrait_SKIP",
        "ratio": "16:9",
        "prompt": (
            "Majestic cinematic wide portrait of three farm animals photographed together in "
            "a single frame, all at eye level, set against a dramatic Costa Rican mountain "
            "sunset. Left third: a Dutch rabbit — compact body, distinctive dark chocolate-brown "
            "patches on its hindquarters and head, bright white blaze and white front body, ears "
            "upright, shot with warm amber backlighting creating a rimlight halo. The rabbit has "
            "clear dark markings on a white coat — NOT a plain white rabbit. Center: a white Pekin "
            "duck standing proud, orange bill, white feathers glowing amber from the setting sun. "
            "Right: a heritage breed Rhode Island Red chicken, rich mahogany-red and copper "
            "feathers, standing tall, feathers backlit with golden light. All three animals "
            "sharp. Behind them: rolling misty Costa Rican mountain ridgelines in deep silhouette, "
            "sky ablaze in amber, orange, crimson, indigo. Shallow depth of field on background. "
            "Ultra-dramatic backlighting, premium brand campaign photography, "
            "National Geographic meets Michelin-star. Photorealistic, no CGI, 85mm lens."
        ),
    },
    {
        "id": "08_chef_plating",
        "ratio": "3:4",
        "prompt": (
            "Restaurant kitchen close-up. A chef in a clean white apron is plating a dish. "
            "LEFT HAND: firmly holds a standard silver dinner fork with four tines, tines "
            "pointing down to hold a slice of cooked rabbit saddle on a large white ceramic plate. "
            "RIGHT HAND: holding a clean silver dinner knife, using the flat of the blade to "
            "guide and position the meat slice onto the plate. Both hands clearly visible, "
            "both utensils recognizable — a fork in the left and a knife in the right. "
            "Minimalist fine-dining presentation — pale purée smear, micro herbs. "
            "Warm amber bokeh background from candlelight. Shallow depth of field, hands and "
            "food sharp, background blurred. 85mm macro lens. Cinematic Michelin-star "
            "restaurant editorial photography, photorealistic, no CGI."
        ),
    },
    {
        "id": "10_product_hero_base",
        "ratio": "4:3",
        "prompt": (
            "Dark dramatic product photography on polished black slate. Three vacuum-sealed "
            "clear plastic bags arranged in a loose triangular layout. Each bag contains visibly "
            "real, raw premium meat: one bag contains a whole rabbit leg and loin — pale pink "
            "lean meat clearly visible through the clear plastic; one bag contains two large "
            "duck breast halves — dark red and purple-tinged meat with a thick fat cap clearly "
            "visible; one bag contains bone-in chicken thighs — golden skin and deep red meat "
            "visible. The vacuum seal is tight against the meat showing its shape. "
            "Each bag has a small plain matte black rectangular label area at the top with no "
            "visible text. A sprig of fresh thyme and two halved garlic cloves as accents. "
            "Single dramatic sidelight from upper-left, deep shadows, bright edges on packaging. "
            "Premium editorial food and product photography, photorealistic, crystal-clear "
            "plastic vacuum bags — the meat inside is the hero. No fake brand names. No CGI."
        ),
    },
]


def gen_image(client, prompt, ratio, out_path, use_hd=False):
    model = MODEL_HD if use_hd else MODEL
    print(f"  generating {out_path.name} with {model}...")
    try:
        resp = client.models.generate_images(
            model=model,
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                output_mime_type="image/jpeg",
                aspect_ratio=ratio
            )
        )
        for img_obj in resp.generated_images:
            img = Image.open(io.BytesIO(img_obj.image.image_bytes))
            img.save(out_path, quality=94)
            print(f"  saved {out_path.name} ({out_path.stat().st_size // 1024}KB)")
            return True
    except Exception as e:
        print(f"  [!] error: {e}")
    return False


def composite_logo_onto_packaging(base_path, logo_path, out_path):
    """Stamp the logo coin onto each of the three vacuum packs."""
    base = Image.open(base_path).convert("RGB")
    coin = Image.open(logo_path).convert("RGBA")
    W, H = base.size
    print(f"  compositing logo onto packaging ({W}x{H})...")

    # Target coin diameter: ~11% of image width per stamp
    diam = int(W * 0.11)
    coin = coin.resize((diam, diam), Image.LANCZOS)

    # Circular mask with soft feathered edge
    mask = Image.new("L", (diam, diam), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((2, 2, diam - 3, diam - 3), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=3))

    # Slightly darken the coin to blend with dark packaging
    coin_rgb = Image.new("RGBA", (diam, diam), (0, 0, 0, 0))
    coin_rgb.paste(coin, (0, 0))
    enhancer = ImageEnhance.Brightness(coin_rgb)
    coin_rgb = enhancer.enhance(0.88)

    # Three stamp positions matching typical triangular pack layout:
    # top-center of each package (approximate, works for triangular arrangement)
    positions = [
        (int(W * 0.22), int(H * 0.18)),   # left package
        (int(W * 0.53), int(H * 0.08)),   # top-center package
        (int(W * 0.72), int(H * 0.38)),   # right package
    ]

    result = base.copy()
    for (cx, cy) in positions:
        x = cx - diam // 2
        y = cy - diam // 2
        result.paste(coin_rgb, (x, y), mask)

    result.save(out_path, quality=94)
    print(f"  composited → {out_path.name} ({out_path.stat().st_size // 1024}KB)")


def main():
    client = genai.Client(api_key=API_KEY)

    for shot in SHOTS:
        is_hd = shot["id"] == "10_product_hero_base"  # use standard for product hero
        out = OUT_DIR / f"{shot['id']}.jpg"

        success = gen_image(client, shot["prompt"], shot["ratio"], out, use_hd=is_hd)
        if not success:
            print(f"  retrying {shot['id']} with HD model...")
            success = gen_image(client, shot["prompt"], shot["ratio"], out, use_hd=True)

        if success:
            print(f"  OK {shot['id']}")
        else:
            print(f"  FAILED {shot['id']}")

        # Composite logo onto the product hero
        if success and shot["id"] == "10_product_hero_base":
            final = OUT_DIR / "10_product_hero.jpg"
            composite_logo_onto_packaging(out, LOGO, final)
            print(f"  OK 10_product_hero.jpg (composited)")
            out.unlink()  # remove the base file, keep only composited version

        if shot != SHOTS[-1]:
            time.sleep(DELAY)

    print("\nAll done. Copy updated files to explainer-video/public/explainer/ to preview.")


if __name__ == "__main__":
    main()
