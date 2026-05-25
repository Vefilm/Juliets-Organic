import React, { useRef, useEffect } from "react";
import { useCurrentFrame } from "remotion";

interface Props {
  opacity?: number;
}

export const FilmGrain: React.FC<Props> = ({ opacity = 0.038 }) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width;
    const H = canvas.height;
    const img = ctx.createImageData(W, H);
    const d = img.data;

    // Deterministic LCG seeded per frame — same frame always same grain
    let s = ((frame + 1) * 1664525 + 1013904223) | 0;
    const rng = () => {
      s = (Math.imul(1664525, s) + 1013904223) | 0;
      return (s >>> 0) / 4294967296;
    };

    for (let i = 0; i < d.length; i += 4) {
      const g = (rng() * 255) | 0;
      d[i] = d[i + 1] = d[i + 2] = g;
      d[i + 3] = 255;
    }

    ctx.putImageData(img, 0, 0);
  }, [frame]);

  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={270}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity,
        mixBlendMode: "overlay",
        pointerEvents: "none",
        imageRendering: "pixelated",
      }}
    />
  );
};
