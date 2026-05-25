export type TextPosition = "bottom-left" | "bottom-right" | "center" | "top-left";
export type TextTheme = "light" | "dark";
export type KBMotion =
  | "zoom-in"         // slow push-in from center
  | "zoom-out"        // pull back (logo reveal)
  | "pan-right"       // horizontal pan L→R (van tracking)
  | "pan-left"        // horizontal pan R→L
  | "pan-up"          // vertical pan bottom→top
  | "drift-right"     // zoom-in + drift L→R
  | "drift-left"      // zoom-in + drift R→L
  | "drift-up"        // zoom-in + drift upward (POV push)
  | "drift-diagonal"; // zoom-in + diagonal drift

export interface SceneData {
  id: string;
  video: string;           // filename inside assets/videos/
  durationSec: number;
  headline: string;
  subline?: string;
  position: TextPosition;
  theme: TextTheme;
  delayFrames?: number;    // frames before text appears (default 18)
  motion?: KBMotion;       // Ken Burns parallax motion preset
  hasFgLayer?: boolean;    // true = foreground PNG extracted, render 2-layer parallax
}

// Video files are resolved relative to the public/ folder in Remotion.
// Copy assets/videos/*.mp4 into explainer-video/public/videos/ before rendering.
const V = (f: string) => `videos/${f}`;

export const FPS = 30;
export const TRANSITION_FRAMES = 20; // cross-fade between scenes

export const SCENES: SceneData[] = [
  {
    id: "01_aerial_farm",
    video: V("01_aerial_farm.mp4"),
    durationSec: 6,
    headline: "Two Farms.",
    subline: "San José & Río Claro, Costa Rica.",
    position: "bottom-left",
    theme: "light",
    motion: "zoom-in",
    hasFgLayer: false,   // aerial — no meaningful subject to separate
  },
  {
    id: "02_rabbit_pov",
    video: V("02_rabbit_pov_running.mp4"),
    durationSec: 6,
    headline: "Raised on Open Pasture.",
    subline: "No hormones. No antibiotics. Ever.",
    position: "bottom-left",
    theme: "light",
    motion: "drift-up",
    hasFgLayer: true,    // grass foreground floats over background pasture
  },
  {
    id: "03_animals_portrait",
    video: V("03_animals_sunset_portrait.mp4"),
    durationSec: 7,
    headline: "Rabbit. Duck. Chicken.",
    subline: "Three animals. Selected for flavor.",
    position: "bottom-left",
    theme: "light",
    motion: "drift-left",
    hasFgLayer: true,    // animals float over golden hour background
  },
  {
    id: "04_farm_establishing",
    video: V("04_farm_establishing.mp4"),
    durationSec: 6,
    headline: "From the Farm.",
    subline: "Every cut starts here.",
    position: "bottom-left",
    theme: "light",
    delayFrames: 24,
    motion: "drift-right",
    hasFgLayer: true,    // farmhouse floats over sky/pasture
  },
  {
    id: "05_butcher_hands",
    video: V("05_butcher_hands_vacuum.mp4"),
    durationSec: 6,
    headline: "Vacuum-Sealed at the Source.",
    subline: "Cold chain begins the moment it's cut.",
    position: "bottom-left",
    theme: "light",
    motion: "zoom-in",
    hasFgLayer: true,    // hands + product float over steel table
  },
  {
    id: "06_delivery_van",
    video: V("06_delivery_van_road.mp4"),
    durationSec: 7,
    headline: "Door to Door.",
    subline: "Refrigerated. On time. Every time.",
    position: "bottom-left",
    theme: "light",
    motion: "pan-right",
    hasFgLayer: true,    // van floats over jungle road
  },
  {
    id: "07_unboxing",
    video: V("07_premium_unboxing.mp4"),
    durationSec: 6,
    headline: "For the Home Chef.",
    subline: "Weekly and monthly boxes. Recipes included.",
    position: "bottom-left",
    theme: "light",
    motion: "zoom-in",
    hasFgLayer: true,    // box and contents float
  },
  {
    id: "08_chef_plating",
    video: V("08_chef_plating.mp4"),
    durationSec: 6,
    headline: "For Professional Kitchens.",
    subline: "Consistent cuts. Standardized weights.",
    position: "bottom-left",
    theme: "light",
    motion: "drift-diagonal",
    hasFgLayer: true,    // plate floats over kitchen background
  },
  {
    id: "09_family_table",
    video: V("09_family_table.mp4"),
    durationSec: 7,
    headline: "Every Table Deserves This.",
    position: "bottom-left",
    theme: "light",
    delayFrames: 30,
    motion: "zoom-in",
    hasFgLayer: true,    // table/food floats over family/room
  },
  {
    id: "10_product_hero",
    video: V("10_product_hero.mp4"),
    durationSec: 6,
    headline: "Order Weekly. Order Monthly.",
    subline: "julietsorganicmeats.com",
    position: "bottom-left",
    theme: "light",
    motion: "drift-left",
    hasFgLayer: true,    // ingredients float over marble background
  },
  {
    id: "11_logo_hero",
    video: V("11_logo_hero.mp4"),
    durationSec: 8,
    headline: "Juliet's Organic Meats",
    subline: "Costa Rica",
    position: "center",
    theme: "light",
    delayFrames: 36,
    motion: "zoom-out",
    hasFgLayer: true,    // coin floats over dark amber background
  },
];

export const TOTAL_DURATION_FRAMES =
  SCENES.reduce((acc, s) => acc + s.durationSec * FPS, 0) +
  (SCENES.length - 1) * TRANSITION_FRAMES;
