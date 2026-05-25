import React from "react";
import { Composition } from "remotion";
import { ExplainerVideo } from "./ExplainerVideo";
import { TOTAL_DURATION_FRAMES, FPS } from "./scenes";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* PRIMARY — depth-parallax on photos via WebGL */}
      <Composition
        id="ExplainerVideo"
        component={ExplainerVideo}
        defaultProps={{ useImageFallback: true }}
        durationInFrames={TOTAL_DURATION_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />

      {/* SECONDARY — pre-rendered depth-parallax videos */}
      <Composition
        id="ExplainerVideo-Video"
        component={ExplainerVideo}
        defaultProps={{ useImageFallback: false }}
        durationInFrames={TOTAL_DURATION_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
