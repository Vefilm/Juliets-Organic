import React, { useRef, useEffect, useState } from "react";
import { useCurrentFrame, useVideoConfig, delayRender, continueRender } from "remotion";
import { KBMotion } from "./scenes";

// Matches generate_depth_parallax.py PARALLAX_PX
const PARALLAX_PX = 85;

const MOTION_INDEX: Record<KBMotion, number> = {
  "zoom-in":        0,
  "zoom-out":       1,
  "pan-right":      2,
  "pan-left":       3,
  "pan-up":         4,
  "drift-right":    5,
  "drift-left":     6,
  "drift-up":       7,
  "drift-diagonal": 8,
};

// Full-screen quad
const VS = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  v_uv.y = 1.0 - v_uv.y;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

// Depth-warped sampling — exact mirror of generate_depth_parallax.py make_remap()
const FS = `
precision highp float;
uniform sampler2D u_img;
uniform sampler2D u_depth;
uniform float u_t;
uniform float u_px;
uniform int u_m;
varying vec2 v_uv;

// Blurred depth sample — smooths boundary transitions to reduce tearing
float depthAt(vec2 uv) {
  float s = 10.0 / 1920.0;
  float d = 0.0;
  d += texture2D(u_depth, uv + vec2(-s, -s)).r;
  d += texture2D(u_depth, uv + vec2( 0., -s)).r * 2.0;
  d += texture2D(u_depth, uv + vec2( s, -s)).r;
  d += texture2D(u_depth, uv + vec2(-s,  0.)).r * 2.0;
  d += texture2D(u_depth, uv).r * 4.0;
  d += texture2D(u_depth, uv + vec2( s,  0.)).r * 2.0;
  d += texture2D(u_depth, uv + vec2(-s,  s)).r;
  d += texture2D(u_depth, uv + vec2( 0.,  s)).r * 2.0;
  d += texture2D(u_depth, uv + vec2( s,  s)).r;
  return d / 16.0;
}

void main() {
  vec2  c  = vec2(0.5);
  // Pre-zoom overscan: gives buffer so warp never clamps to edge
  vec2  uv = c + (v_uv - c) / 1.08;
  float d  = depthAt(uv);
  float pw = u_px / 1920.0;
  float ph = u_px / 1080.0;

  if      (u_m == 0) { float z = 1.0 + u_t * (0.12 + 0.08 * d); uv = c + (uv - c) / z; }
  else if (u_m == 1) { float z = 1.0 + u_t * (0.10 + 0.06 * d); uv = c + (uv - c) * z; }
  else if (u_m == 2) { uv.x -= u_t * pw * d; }
  else if (u_m == 3) { uv.x += u_t * pw * d; }
  else if (u_m == 4) { uv.y += u_t * ph * d; }
  else if (u_m == 5) { float z = 1.0 + u_t * (0.08 + 0.04 * d); uv = c + (uv - c) / z; uv.x -= u_t * pw * 0.5 * d; }
  else if (u_m == 6) { float z = 1.0 + u_t * (0.08 + 0.04 * d); uv = c + (uv - c) / z; uv.x += u_t * pw * 0.5 * d; }
  else if (u_m == 7) { float z = 1.0 + u_t * (0.08 + 0.04 * d); uv = c + (uv - c) / z; uv.y += u_t * ph * 0.5 * d; }
  else if (u_m == 8) { float z = 1.0 + u_t * (0.07 + 0.04 * d); uv = c + (uv - c) / z; uv.x -= u_t * pw * 0.4 * d; uv.y -= u_t * ph * 0.24 * d; }

  uv = clamp(uv, 0.001, 0.999);
  gl_FragColor = texture2D(u_img, uv);
}`;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

function makeShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

function makeTexture(gl: WebGLRenderingContext, img: HTMLImageElement): WebGLTexture {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return tex;
}

interface Props {
  imgSrc:      string;
  depthSrc:    string;
  motion:      KBMotion;
  durationSec: number;
}

export const DepthParallaxCanvas: React.FC<Props> = ({
  imgSrc, depthSrc, motion, durationSec,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = Math.min(frame / (durationSec * fps - 1), 1);

  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const glRef       = useRef<WebGLRenderingContext | null>(null);
  const progRef     = useRef<WebGLProgram | null>(null);
  const texImgRef   = useRef<WebGLTexture | null>(null);
  const texDepthRef = useRef<WebGLTexture | null>(null);
  const [ready, setReady] = useState(false);
  const [handle]    = useState(() => delayRender("depth-textures"));

  // Init WebGL once — load both textures, then signal Remotion to proceed
  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext("webgl")!;
    glRef.current = gl;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, makeShader(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, makeShader(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    progRef.current = prog;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    Promise.all([loadImage(imgSrc), loadImage(depthSrc)]).then(([imgEl, depthEl]) => {
      texImgRef.current   = makeTexture(gl, imgEl);
      texDepthRef.current = makeTexture(gl, depthEl);
      setReady(true);
      continueRender(handle);
    });
  }, []);

  // Redraw every frame with updated t and motion
  useEffect(() => {
    const gl   = glRef.current;
    const prog = progRef.current;
    if (!gl || !prog || !ready) return;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texImgRef.current!);
    gl.uniform1i(gl.getUniformLocation(prog, "u_img"), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texDepthRef.current!);
    gl.uniform1i(gl.getUniformLocation(prog, "u_depth"), 1);

    gl.uniform1f(gl.getUniformLocation(prog, "u_t"),  t);
    gl.uniform1f(gl.getUniformLocation(prog, "u_px"), PARALLAX_PX);
    gl.uniform1i(gl.getUniformLocation(prog, "u_m"),  MOTION_INDEX[motion] ?? 0);

    gl.viewport(0, 0, 1920, 1080);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.flush();
  }, [frame, ready, motion]);

  return (
    <canvas
      ref={canvasRef}
      width={1920}
      height={1080}
      style={{ position: "absolute", width: "100%", height: "100%" }}
    />
  );
};
