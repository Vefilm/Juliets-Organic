# Juliet's Explainer Video — Setup & Render

## Step 1: Generate the videos
From the Rabbit Farm folder, run once:
```
python generate_videos.py
```
This batch-animates all 11 images via Veo (~25-35 min total). Already-done shots are skipped.

## Step 2: Copy videos into Remotion's public folder
```
xcopy /E /I "C:\Users\vefil\Desktop\Rabbit Farm\assets\videos" "C:\Users\vefil\Desktop\Rabbit Farm\explainer-video\public\videos"
```

## Step 3: Install Remotion dependencies (one time)
```
cd "C:\Users\vefil\Desktop\Rabbit Farm\explainer-video"
npm install
```
Requires Node.js 18+. Download at https://nodejs.org if not installed.

## Step 4: Preview in browser
```
npm start
```
Opens Remotion Studio at localhost:3000. Scrub through the video, adjust timing.

## Step 5: Render final MP4
```
npm run render
```
Outputs: `out/explainer.mp4` at 1920×1080, H.264.

---

## Adjusting text / copy
Edit `src/scenes.ts` — each scene has `headline` and `subline` fields.

## Adjusting timing
Change `durationSec` per scene in `src/scenes.ts`.

## Using still images while videos generate
In `src/ExplainerVideo.tsx`, set:
```ts
const USE_IMAGE_FALLBACK = true;
```
This uses the JPEGs from assets/explainer/ so you can design before Veo finishes.
