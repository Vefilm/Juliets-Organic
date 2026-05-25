import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  Video,
  Img,
  interpolate,
  Easing,
  staticFile,
} from "remotion";
import { SceneData, KBMotion } from "./scenes";
import { Particles } from "./Particles";
import { DepthParallaxCanvas } from "./DepthParallaxCanvas";
import { FilmGrain } from "./FilmGrain";

const BRASS     = "#c9a052";
const BRASS_MID = "#c9a05299";
const BRASS_DIM = "#c9a05244";
const WHITE     = "#f0ece4";
const WHITE_MID = "#f0ece4bb";

const SCENE_GRADE: Record<string, string> = {
  "01_aerial_farm":       "rgba(201, 160, 82, 0.07)",
  "02_rabbit_pov":        "rgba(201, 160, 82, 0.06)",
  "03_animals_portrait":  "rgba(220, 128, 42, 0.11)",
  "04_farm_establishing": "rgba(201, 160, 82, 0.07)",
  "05_butcher_hands":     "rgba(88, 110, 152, 0.06)",
  "06_delivery_van":      "rgba(88, 110, 140, 0.05)",
  "07_unboxing":          "rgba(201, 160, 82, 0.07)",
  "08_chef_plating":      "rgba(180, 118, 52, 0.09)",
  "09_family_table":      "rgba(220, 132, 48, 0.09)",
  "10_product_hero":      "rgba(230, 98, 22, 0.10)",
  "11_logo_hero":         "rgba(190, 138, 52, 0.08)",
};

// Easing presets
const eOut  = (x: number) => Easing.out(Easing.cubic)(x);
const eInOut = (x: number) => Easing.inOut(Easing.cubic)(x);
const eSnap = (x: number) => Easing.out(Easing.back(1.6))(x);  // slight overshoot for snap

function lerp(frame: number, [f0, f1]: [number, number], [v0, v1]: [number, number], ease = eOut) {
  return interpolate(frame, [f0, f1], [v0, v1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
}

// Foreground parallax: moves counter to the background Ken Burns direction.
// Background drifts one way → foreground drifts the opposite → clear depth separation.
// Background also gets a subtle blur to sell depth-of-field.
function fgParallax(frame: number, dur: number, motion: KBMotion): string {
  const lin = (v0: number, v1: number) =>
    interpolate(frame, [0, dur], [v0, v1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  switch (motion) {
    case "zoom-in":
      // BG zooms 1.06→1.14; FG barely grows — BG rushes in while subject holds position
      return `scale(${lin(1.04, 1.07)})`;
    case "zoom-out":
      // BG zooms 1.14→1.05; FG stays close to viewer
      return `scale(${lin(1.03, 1.01)})`;
    case "pan-right":
      // BG slides right 124px; FG slides LEFT — maximum opposing parallax
      return `scale(1.02) translateX(${lin(28, -28)}px)`;
    case "pan-left":
      return `scale(1.02) translateX(${lin(-28, 28)}px)`;
    case "pan-up":
      return `scale(1.02) translateY(${lin(22, -22)}px)`;
    case "drift-right":
      // BG drifts right 64px; FG drifts left (opposing)
      return `scale(${lin(1.02, 1.05)}) translateX(${lin(24, -24)}px)`;
    case "drift-left":
      // BG drifts left 64px; FG drifts right (opposing)
      return `scale(${lin(1.02, 1.05)}) translateX(${lin(-24, 24)}px)`;
    case "drift-up":
      return `scale(${lin(1.02, 1.05)}) translateY(${lin(20, -20)}px)`;
    case "drift-diagonal":
      return `scale(${lin(1.02, 1.05)}) translateX(${lin(-18, 18)}px) translateY(${lin(-14, 14)}px)`;
    default:
      return `scale(1.02)`;
  }
}

// Ken Burns: linear drift over the full scene duration.
// Scale always stays ≥1.06 so edges are never revealed (container has overflow:hidden).
function kbTransform(frame: number, dur: number, motion: KBMotion = "zoom-in"): string {
  const lin = (v0: number, v1: number) =>
    interpolate(frame, [0, dur], [v0, v1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  switch (motion) {
    case "zoom-out":
      return `scale(${lin(1.14, 1.05)})`;
    case "pan-right":
      return `scale(1.10) translateX(${lin(-62, 62)}px)`;
    case "pan-left":
      return `scale(1.10) translateX(${lin(62, -62)}px)`;
    case "pan-up":
      return `scale(1.10) translateY(${lin(44, -44)}px)`;
    case "drift-right":
      return `scale(${lin(1.06, 1.13)}) translateX(${lin(-32, 32)}px)`;
    case "drift-left":
      return `scale(${lin(1.06, 1.13)}) translateX(${lin(32, -32)}px)`;
    case "drift-up":
      return `scale(${lin(1.06, 1.14)}) translateY(${lin(26, -26)}px)`;
    case "drift-diagonal":
      return `scale(${lin(1.06, 1.12)}) translateX(${lin(22, -18)}px) translateY(${lin(16, -22)}px)`;
    case "zoom-in":
    default:
      return `scale(${lin(1.06, 1.14)})`;
  }
}

interface Props {
  scene: SceneData;
  useImageFallback?: boolean;
}

export const Scene: React.FC<Props> = ({ scene, useImageFallback = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = scene.durationSec * fps;
  const d   = scene.delayFrames ?? 18;

  // Stagger timing — each element enters in sequence
  const T_RULE  = d;
  const T_LABEL = d + 10;
  const T_HEAD  = d + 22;
  const T_SUB   = d + 36;
  const T_BAR   = d;           // accent bar draws simultaneously with rule

  // --- EXIT — unified fade starting 28 frames before end ---
  const exit = lerp(frame, [dur - 28, dur - 6], [1, 0], eInOut);

  // --- GRADIENT REVEAL ---
  const gradReveal = lerp(frame, [0, 22], [0, 1]);

  // ── RULE draw-in (width 0 → 52px) ──────────────────────────────────
  const ruleW = lerp(frame, [T_RULE, T_RULE + 16], [0, 52]);

  // ── ACCENT BAR draw-up (height 0 → 76px) ───────────────────────────
  const barH = lerp(frame, [T_BAR, T_BAR + 22], [0, 76]);

  // ── LABEL: fade + letter-spacing compress ──────────────────────────
  const labelAlpha = lerp(frame, [T_LABEL, T_LABEL + 18], [0, 1]);
  const labelTrack = lerp(frame, [T_LABEL, T_LABEL + 24], [0.52, 0.22]);

  // ── HEADLINE: opacity + translateY + scale snap ─────────────────────
  const headAlpha = lerp(frame, [T_HEAD, T_HEAD + 20], [0, 1]);
  const headY     = lerp(frame, [T_HEAD, T_HEAD + 28], [36, 0]);
  const headScale = lerp(frame, [T_HEAD, T_HEAD + 26], [0.94, 1.0], eSnap);

  // ── SUBLINE: fade + subtle Y ────────────────────────────────────────
  const subAlpha = lerp(frame, [T_SUB, T_SUB + 20], [0, 1]);
  const subY     = lerp(frame, [T_SUB, T_SUB + 18], [16, 0]);

  // ── GOLD RULE: gentle sine-wave breath after draw-in completes ───────
  const rulePulse = frame >= T_RULE + 16
    ? 0.82 + 0.18 * Math.sin((frame - T_RULE - 16) * 0.11)
    : 1;

  const isCenter   = scene.position === "center";
  const isLight    = scene.theme === "light";
  const textColor  = isLight ? WHITE : "#1a1a1a";
  const gradeColor = SCENE_GRADE[scene.id] ?? "transparent";

  const gradient = isCenter
    ? `radial-gradient(ellipse at center, rgba(6,6,6,0.65) 0%, rgba(6,6,6,0.90) 100%)`
    : `linear-gradient(to top,
        rgba(6,6,6,0.94) 0%,
        rgba(6,6,6,0.68) 30%,
        rgba(6,6,6,0.22) 56%,
        rgba(6,6,6,0.06) 76%,
        rgba(6,6,6,0.00) 100%)`;

  const videoSrc  = staticFile(scene.video);
  const imgSrc    = staticFile(
    scene.video.replace(".mp4", ".jpg").replace("videos/", "explainer/")
  );
  const depthSrc  = staticFile(
    scene.video.replace(".mp4", ".png").replace("videos/", "depth/")
  );

  return (
    <div style={{
      width: "100%", height: "100%",
      position: "relative", overflow: "hidden",
      background: "#060606",
    }}>

      {/* Background — depth parallax on both paths */}
      {useImageFallback ? (
        <DepthParallaxCanvas
          imgSrc={imgSrc}
          depthSrc={depthSrc}
          motion={scene.motion ?? "zoom-in"}
          durationSec={scene.durationSec}
        />
      ) : (
        <Video src={videoSrc} style={{
          width: "100%", height: "100%",
          objectFit: "cover", position: "absolute",
        }} muted />
      )}

      {/* Color grade — per-scene warm/cool tint over the raw photo */}
      <div style={{
        position: "absolute", inset: 0,
        background: gradeColor,
        mixBlendMode: "soft-light",
        pointerEvents: "none",
        opacity: gradReveal,
      }} />

      {/* Cinematic gradient overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: gradient,
        opacity: gradReveal,
      }} />

      {/* Vignette — darkens edges to focus attention inward */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,0.62) 100%)",
        pointerEvents: "none",
        opacity: gradReveal,
      }} />

      {/* Floating dust particles */}
      <Particles
        seed={parseInt(scene.id.slice(0, 2), 10)}
        count={42}
        tint={scene.theme === "light" ? "#f0e4c8" : "#e8dfc8"}
      />

      {/* Film grain — cinematic texture */}
      <FilmGrain />

      {/* Cinematic scope bars — 2.35:1 letterbox */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: 132, background: "#000",
        zIndex: 8,
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: 132, background: "#000",
        zIndex: 8,
      }} />

      {/* ─── BOTTOM-LEFT TEXT TREATMENT ────────────────────────────────── */}
      {!isCenter && (
        <div style={{
          position: "absolute",
          bottom: 160,
          left: 80,
          maxWidth: 980,
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          opacity: exit,
        }}>

          {/* Vertical accent bar */}
          <div style={{
            width: 2,
            height: barH,
            background: `linear-gradient(to bottom, ${BRASS}, ${BRASS_DIM})`,
            marginRight: 22,
            marginTop: 6,
            flexShrink: 0,
          }} />

          {/* Text column */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>

            {/* Gold rule line */}
            <div style={{
              width: ruleW,
              height: 2,
              background: `linear-gradient(to right, ${BRASS}, ${BRASS_MID})`,
              marginBottom: 14,
              opacity: rulePulse,
            }} />

            {/* Brand label */}
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: `${labelTrack}em`,
              textTransform: "uppercase",
              color: BRASS,
              marginBottom: 16,
              opacity: labelAlpha,
            }}>
              Juliet's Organic Meats
            </div>

            {/* Headline */}
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 98,
              fontWeight: 600,
              fontStyle: "italic",
              color: textColor,
              lineHeight: 1.0,
              letterSpacing: "-0.02em",
              textShadow: "0 2px 48px rgba(0,0,0,0.7), 0 1px 0 rgba(0,0,0,0.4)",
              marginBottom: scene.subline ? 20 : 0,
              opacity: headAlpha,
              transform: `translateY(${headY}px) scale(${headScale})`,
              transformOrigin: "left center",
            }}>
              {scene.headline}
            </div>

            {/* Subline — standard treatment */}
            {scene.subline && scene.id !== "10_product_hero" && (
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 19,
                letterSpacing: "0.20em",
                textTransform: "uppercase",
                color: isLight ? WHITE_MID : "#1a1a1acc",
                fontWeight: 300,
                opacity: subAlpha,
                transform: `translateY(${subY}px)`,
              }}>
                {scene.subline}
              </div>
            )}

            {/* Scene 10 — CTA treatment: URL as a call-to-action block */}
            {scene.id === "10_product_hero" && scene.subline && (
              <div style={{
                marginTop: 22,
                opacity: subAlpha,
                transform: `translateY(${subY}px)`,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}>
                <div style={{ width: 44, height: 1, background: `${BRASS}66` }} />
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 22, height: 22,
                    border: `1px solid ${BRASS}bb`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 12,
                      color: BRASS,
                      lineHeight: 1,
                    }}>→</span>
                  </div>
                  <div style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 18,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: BRASS,
                    fontWeight: 400,
                  }}>
                    {scene.subline}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ─── CENTER TEXT TREATMENT (scene 11 logo hero) ─────────────────── */}
      {isCenter && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          opacity: exit,
        }}>

          {/* Ornamental diamond divider — arms draw outward from center */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            marginBottom: 28,
          }}>
            <div style={{ width: ruleW / 2, height: 1, background: `linear-gradient(to right, transparent, ${BRASS})`, opacity: rulePulse }} />
            <div style={{
              width: 7, height: 7,
              background: BRASS,
              transform: "rotate(45deg)",
              flexShrink: 0,
              margin: "0 3px",
              opacity: lerp(frame, [T_RULE + 6, T_RULE + 22], [0, 1]) * rulePulse,
            }} />
            <div style={{ width: ruleW / 2, height: 1, background: `linear-gradient(to left, transparent, ${BRASS})`, opacity: rulePulse }} />
          </div>

          {/* Center headline */}
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 108,
            fontWeight: 600,
            fontStyle: "italic",
            color: WHITE,
            lineHeight: 1.0,
            letterSpacing: "-0.01em",
            textAlign: "center",
            textShadow: "0 4px 64px rgba(0,0,0,0.8)",
            marginBottom: scene.subline ? 22 : 0,
            opacity: headAlpha,
            transform: `translateY(${headY}px) scale(${headScale})`,
            transformOrigin: "center center",
          }}>
            {scene.headline}
          </div>

          {/* Center subline */}
          {scene.subline && (
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 16,
              letterSpacing: "0.38em",
              textTransform: "uppercase",
              color: BRASS_MID,
              fontWeight: 300,
              opacity: subAlpha,
              transform: `translateY(${subY}px)`,
            }}>
              {scene.subline}
            </div>
          )}

        </div>
      )}

      {/* Scene 11 — closing CTA block */}
      {isCenter && scene.id === "11_logo_hero" && (
        <div style={{
          position: "absolute",
          bottom: 152,
          left: 0, right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          opacity: exit * lerp(frame, [82, 108], [0, 1]),
        }}>
          <div style={{ width: 40, height: 1, background: `${BRASS}55` }} />
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 17,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: `${BRASS}dd`,
            fontWeight: 300,
          }}>
            julietsorganicmeats.com
          </div>
        </div>
      )}

    </div>
  );
};
