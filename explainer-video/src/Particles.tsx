import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

interface Particle {
  x: number;       // initial 0–1
  y: number;       // initial 0–1
  size: number;    // px
  opacity: number;
  speed: number;   // fraction of frame height per second (upward)
  swayAmp: number; // px
  swayFreq: number;// Hz
  phase: number;   // radians
}

// Deterministic seeded PRNG — same frame always produces same positions
function seededRng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}

function buildParticles(seed: number, count: number): Particle[] {
  const r = seededRng(seed);
  return Array.from({ length: count }, () => ({
    x:        r(),
    y:        r(),
    size:     0.8 + r() * 3.2,
    opacity:  0.06 + r() * 0.22,
    speed:    0.025 + r() * 0.065,
    swayAmp:  6 + r() * 22,
    swayFreq: 0.08 + r() * 0.28,
    phase:    r() * Math.PI * 2,
  }));
}

interface Props {
  seed?: number;
  count?: number;
  tint?: string;   // particle color, defaults to warm cream
}

export const Particles: React.FC<Props> = ({
  seed  = 1,
  count = 45,
  tint  = "#f0e4c8",
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const t = frame / fps;

  const particles = React.useMemo(() => buildParticles(seed, count), [seed, count]);

  return (
    <div style={{
      position: "absolute", inset: 0,
      pointerEvents: "none", overflow: "hidden",
    }}>
      {particles.map((p, i) => {
        // Upward drift, wrapping
        const rawY = p.y - p.speed * t;
        const y = ((rawY % 1) + 1) % 1;

        // Horizontal sway
        const sway = Math.sin(t * p.swayFreq * Math.PI * 2 + p.phase) * p.swayAmp;
        const x = p.x + sway / width;

        // Fade near edges so wrap is invisible
        const edgeFade = Math.min(y / 0.07, (1 - y) / 0.07, 1);

        return (
          <div key={i} style={{
            position: "absolute",
            left: `${x * 100}%`,
            top:  `${y * 100}%`,
            width:  p.size,
            height: p.size,
            borderRadius: "50%",
            background: tint,
            opacity: p.opacity * edgeFade,
            transform: "translate(-50%, -50%)",
          }} />
        );
      })}
    </div>
  );
};
