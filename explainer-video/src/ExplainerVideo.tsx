import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Sequence,
  Easing,
} from "remotion";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { SCENES, FPS, TRANSITION_FRAMES } from "./scenes";
import { Scene } from "./Scene";

loadPlayfair();
loadInter();

function buildSequences() {
  const sequences: { startFrame: number; durationFrames: number; index: number }[] = [];
  let cursor = 0;
  for (let i = 0; i < SCENES.length; i++) {
    const durationFrames = SCENES[i].durationSec * FPS;
    sequences.push({ startFrame: cursor, durationFrames, index: i });
    cursor += durationFrames;
    if (i < SCENES.length - 1) cursor -= TRANSITION_FRAMES;
  }
  return sequences;
}

const SEQUENCES = buildSequences();

interface Props {
  useImageFallback?: boolean;
}

export const ExplainerVideo: React.FC<Props> = ({ useImageFallback = false }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  return (
    <div style={{ width, height, background: "#060606", position: "relative", overflow: "hidden" }}>

      {SEQUENCES.map(({ startFrame, durationFrames, index }) => {
        const scene = SCENES[index];

        const extendedDuration = index < SCENES.length - 1
          ? durationFrames + TRANSITION_FRAMES
          : durationFrames;

        const localFrame = frame - startFrame;
        const fadeOut = index < SCENES.length - 1
          ? interpolate(
              localFrame,
              [durationFrames - TRANSITION_FRAMES, durationFrames],
              [1, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
            )
          : 1;

        const fadeIn = index > 0
          ? interpolate(
              localFrame,
              [0, TRANSITION_FRAMES],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
            )
          : 1;

        const opacity = Math.min(fadeIn, fadeOut);

        // Incoming: scene arrives from slightly smaller; outgoing: gently pushes away
        const scaleIn = index > 0
          ? interpolate(localFrame, [0, TRANSITION_FRAMES], [0.978, 1.0], {
              extrapolateLeft: "clamp", extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            })
          : 1.0;
        const scaleOut = index < SCENES.length - 1
          ? interpolate(localFrame, [durationFrames - TRANSITION_FRAMES, durationFrames], [1.0, 1.018], {
              extrapolateLeft: "clamp", extrapolateRight: "clamp",
              easing: Easing.in(Easing.cubic),
            })
          : 1.0;

        return (
          <Sequence
            key={scene.id}
            from={startFrame}
            durationInFrames={extendedDuration}
            layout="none"
          >
            <div style={{ position: "absolute", inset: 0, opacity, transform: `scale(${scaleIn * scaleOut})` }}>
              <Scene scene={scene} useImageFallback={useImageFallback} />
            </div>
          </Sequence>
        );
      })}
    </div>
  );
};
