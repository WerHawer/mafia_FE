import { FilesetResolver, ImageSegmenter } from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from "react";

import { QualitySettings } from "@/config/video.ts";
import { UserVideoSettings } from "@/types/user.types.ts";

const SEGMENTATION_WIDTH = 256;
const SEGMENTATION_HEIGHT = 144;
const TASKS_VISION_WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm";
const SELFIE_SEGMENTATION_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter_landscape/float16/latest/selfie_segmenter_landscape.tflite";

const bgEffects = {
  none: 0,
  blur: 1,
  img: 2,
} as const;

type BackgroundEffects = (typeof bgEffects)[keyof typeof bgEffects];

// ─── WebGL Helpers ──────────────────────────────────────────────────────────

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vsSource: string,
  fsSource: string
) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vertexShader || !fragmentShader) {
    if (vertexShader) gl.deleteShader(vertexShader);
    if (fragmentShader) gl.deleteShader(fragmentShader);
    return null;
  }

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

// ─── Shaders ────────────────────────────────────────────────────────────────

const VS_SOURCE = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

const FS_BLUR_SOURCE = `#version 300 es
precision highp float;
in vec2 v_texCoord;
uniform sampler2D u_image;
uniform vec2 u_dir;
out vec4 outColor;

void main() {
  vec4 color = vec4(0.0);
  // 9-tap separable Gaussian blur
  color += texture(u_image, v_texCoord - 4.0 * u_dir) * 0.016216;
  color += texture(u_image, v_texCoord - 3.0 * u_dir) * 0.054054;
  color += texture(u_image, v_texCoord - 2.0 * u_dir) * 0.1216216;
  color += texture(u_image, v_texCoord - 1.0 * u_dir) * 0.1945945;
  color += texture(u_image, v_texCoord) * 0.2270270;
  color += texture(u_image, v_texCoord + 1.0 * u_dir) * 0.1945945;
  color += texture(u_image, v_texCoord + 2.0 * u_dir) * 0.1216216;
  color += texture(u_image, v_texCoord + 3.0 * u_dir) * 0.054054;
  color += texture(u_image, v_texCoord + 4.0 * u_dir) * 0.016216;
  outColor = color;
}
`;

const FS_COMPOSITE_SOURCE = `#version 300 es
precision highp float;
in vec2 v_texCoord;

uniform sampler2D u_video;
uniform sampler2D u_mask;
uniform sampler2D u_background;

uniform int u_bgEffect;
uniform vec2 u_maskTexelSize;

out vec4 outColor;

void main() {
  vec2 texCoord = vec2(1.0 - v_texCoord.x, v_texCoord.y);
  vec4 fgColor = texture(u_video, texCoord);

  if (u_bgEffect == 0) {
    outColor = vec4(fgColor.rgb, 1.0);
    return;
  }

  // ── Single-pass Guided Filter ─────────────────────────────────────
  // Local linear model: q = a * I + b  (Kaiming He et al.)
  // Guide I = video luminance, input p = segmentation mask.
  // 5x5 window at mask-texel spacing (~16x16 video pixels).
  // Preserves hard edges from the video while smoothing flat regions.
  vec2 mt = u_maskTexelSize;
  float mean_I  = 0.0;
  float mean_p  = 0.0;
  float mean_Ip = 0.0;
  float mean_II = 0.0;

  for (int dy = -2; dy <= 2; dy++) {
    for (int dx = -2; dx <= 2; dx++) {
      vec2 sp = texCoord + vec2(float(dx), float(dy)) * mt;
      float I = dot(texture(u_video, sp).rgb, vec3(0.299, 0.587, 0.114));
      float p = texture(u_mask, sp).r;
      mean_I  += I;
      mean_p  += p;
      mean_Ip += I * p;
      mean_II += I * I;
    }
  }

  const float invN = 1.0 / 25.0;
  mean_I  *= invN;
  mean_p  *= invN;
  mean_Ip *= invN;
  mean_II *= invN;

  float var_I = mean_II - mean_I * mean_I;
  const float eps = 0.002;
  float a = (mean_Ip - mean_I * mean_p) / (var_I + eps);
  float b = mean_p - a * mean_I;

  float I_c = dot(fgColor.rgb, vec3(0.299, 0.587, 0.114));
  float maskVal = clamp(a * I_c + b, 0.0, 1.0);

  float alpha = smoothstep(0.22, 0.78, maskVal);

  vec3 fgEnhanced = clamp((fgColor.rgb - 0.5) * 1.04 + 0.52, 0.0, 1.0);
  vec4 bgColor = texture(u_background, texCoord);

  if (u_bgEffect == 1) {
    float dist = distance(texCoord, vec2(0.5, 0.5));
    bgColor.rgb *= smoothstep(0.8, 0.2, dist * 0.7);
  }

  outColor = vec4(mix(bgColor.rgb, fgEnhanced, alpha), 1.0);
}
`;

const isSafari = (() => {
  try {
    const ua = navigator.userAgent;
    return (
      /AppleWebKit/i.test(ua) &&
      /Safari/i.test(ua) &&
      !/Chrome|Chromium|CriOS|FxiOS|EdgiOS|Edg\/|OPR\/|Android/i.test(ua)
    );
  } catch {
    return false;
  }
})();

export const useConfigureVideoWebGL = (
  videoSettings: UserVideoSettings,
  myOriginalStream: MediaStream | null,
  qualitySettings?: QualitySettings,
  onFatalError?: () => void
) => {
  const fps = qualitySettings?.fps ?? 24;
  const canvasWidth = qualitySettings?.width ?? 854;
  const canvasHeight = qualitySettings?.height ?? 480;

  const frameTargetMs = 1000 / fps;
  const backgroundIntervalMs = 1000 / fps;

  const [imageURL, setImageURL] = useState(videoSettings.imageURL);
  const [withBlur, setWithBlur] = useState(videoSettings.withBlur);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const bgFirstEffect = videoSettings.withBlur
    ? bgEffects.blur
    : videoSettings.imageURL
      ? bgEffects.img
      : bgEffects.none;
  const bgEffectsRef = useRef<BackgroundEffects>(bgFirstEffect);
  const isFirstRender = useRef(true);
  const lastFrameTimeRef = useRef<number>(0);
  const withoutEffects = !imageURL && !withBlur;
  const [isBackgroundReady, setIsBackgroundReady] = useState(withoutEffects);
  const isBackgroundReadyRef = useRef(withoutEffects);

  // Stable refs — keep the render-loop closure up to date without
  // causing the heavy useEffect to re-run on every render.
  const onFatalErrorRef = useRef(onFatalError);
  onFatalErrorRef.current = onFatalError;

  const imageURLRef = useRef(imageURL);
  imageURLRef.current = imageURL;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (withoutEffects) {
      bgEffectsRef.current = bgEffects.none;
      return;
    }

    bgEffectsRef.current = withBlur ? bgEffects.blur : bgEffects.img;
  }, [withBlur, imageURL, withoutEffects]);

  useEffect(() => {
    if (!myOriginalStream) {
      setIsBackgroundReady(false);
      isBackgroundReadyRef.current = false;
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    video.srcObject = myOriginalStream;
    video.muted = true;
    video.playsInline = true;

    void video.play().catch((err) => {
      console.error("[useConfigureVideoWebGL] Failed to play video:", err);
    });

    let isRunning = true;
    let imageSegmenter: ImageSegmenter | null = null;
    let rafId: number | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let passthroughRafId: number | null = null;

    // We still need a tiny 2D canvas to extract pixels from the video 
    // to feed into MediaPipe, because MediaPipe segmentForVideo doesn't 
    // take WebGL textures directly in all JS environments easily.
    const segInputCanvas = document.createElement("canvas");
    segInputCanvas.width = SEGMENTATION_WIDTH;
    segInputCanvas.height = SEGMENTATION_HEIGHT;
    const segInputCtx = segInputCanvas.getContext("2d", { willReadFrequently: true });

    let float32Buf = new Float32Array(SEGMENTATION_WIDTH * SEGMENTATION_HEIGHT);

    // ─── WebGL Initialization ───────────────────────────────────────────────
    
    const mainCanvas = canvasRef.current;
    if (!mainCanvas) return;
    
    // We request webgl2
    const gl = mainCanvas.getContext("webgl2", { 
      alpha: false,
      antialias: false,
      depth: false,
      preserveDrawingBuffer: true // Sometimes required for captureStream
    });

    if (!gl) {
      console.error("[useConfigureVideoWebGL] WebGL2 not supported!");
      onFatalErrorRef.current?.();
      return;
    }

    // Float texture LINEAR filtering — required for smooth mask edges with R32F.
    const hasFloatLinear = !!gl.getExtension('OES_texture_float_linear');

    // Context-loss safety: if the GPU driver resets, trigger fallback immediately.
    const onContextLost = (e: Event) => {
      e.preventDefault();
      console.error("[useConfigureVideoWebGL] WebGL context lost");
      isRunning = false;
      onFatalErrorRef.current?.();
    };
    mainCanvas.addEventListener('webglcontextlost', onContextLost);

    // Set up geometry (full screen quad)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0, 
         1.0, -1.0, 
        -1.0,  1.0, 
        -1.0,  1.0, 
         1.0, -1.0, 
         1.0,  1.0
      ]),
      gl.STATIC_DRAW
    );

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0.0, 1.0, 
        1.0, 1.0, 
        0.0, 0.0, 
        0.0, 0.0, 
        1.0, 1.0, 
        1.0, 0.0
      ]),
      gl.STATIC_DRAW
    );

    // Compile programs
    const blurProgram = createProgram(gl, VS_SOURCE, FS_BLUR_SOURCE);
    const compProgram = createProgram(gl, VS_SOURCE, FS_COMPOSITE_SOURCE);

    if (!blurProgram || !compProgram) {
      onFatalErrorRef.current?.();
      return;
    }

    // Setup Composite Program Variables
    const compPosLoc = gl.getAttribLocation(compProgram, "a_position");
    const compTexLoc = gl.getAttribLocation(compProgram, "a_texCoord");
    
    const compVideoUniform = gl.getUniformLocation(compProgram, "u_video");
    const compMaskUniform = gl.getUniformLocation(compProgram, "u_mask");
    const compBgUniform = gl.getUniformLocation(compProgram, "u_background");
    const compBgEffectUniform = gl.getUniformLocation(compProgram, "u_bgEffect");
    const compMaskTexelUniform = gl.getUniformLocation(compProgram, "u_maskTexelSize");

    // Setup Blur Program Variables
    const blurPosLoc = gl.getAttribLocation(blurProgram, "a_position");
    const blurTexLoc = gl.getAttribLocation(blurProgram, "a_texCoord");
    
    const blurImageUniform = gl.getUniformLocation(blurProgram, "u_image");
    const blurDirUniform = gl.getUniformLocation(blurProgram, "u_dir");

    // Textures
    const videoTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, videoTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const maskTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, maskTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Pre-allocated buffer for float32 → uint8 mask conversion.
    // R8 format guarantees LINEAR filtering on all GPUs (R32F doesn't).
    let maskUint8 = new Uint8Array(SEGMENTATION_WIDTH * SEGMENTATION_HEIGHT);

    const bgImageTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, bgImageTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    let uploadedBgImageUrl = "";

    // Blur Framebuffers
    // We blur at 1/4th resolution for wider blur and performance
    let blurW = Math.max(1, Math.round(canvasWidth / 4));
    let blurH = Math.max(1, Math.round(canvasHeight / 4));

    const createFBO = (w: number, h: number) => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      return { tex, fbo, w, h };
    };

    let fbo1 = createFBO(blurW, blurH);
    let fbo2 = createFBO(blurW, blurH);

    // ─── Passthrough Loop ───────────────────────────────────────────────────
    
    const drawPassthrough = (): void => {
      if (!isRunning || imageSegmenter) return;

      if (video.readyState >= 2 && video.videoWidth > 0) {
        if (video.paused) {
          void video.play().catch(() => {});
          return;
        }
        try {
          const vw = video.videoWidth;
          const vh = video.videoHeight;

          if (mainCanvas.width !== vw || mainCanvas.height !== vh) {
            mainCanvas.width = vw;
            mainCanvas.height = vh;
            gl.viewport(0, 0, vw, vh);
          }

          // Upload video texture
          gl.bindTexture(gl.TEXTURE_2D, videoTex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

          // Draw with Composite Shader (bgEffect = none)
          gl.useProgram(compProgram);
          gl.uniform1i(compBgEffectUniform, 0); // none

          // Bind attributes
          gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
          gl.enableVertexAttribArray(compPosLoc);
          gl.vertexAttribPointer(compPosLoc, 2, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
          gl.enableVertexAttribArray(compTexLoc);
          gl.vertexAttribPointer(compTexLoc, 2, gl.FLOAT, false, 0, 0);

          // Bind textures
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, videoTex);
          gl.uniform1i(compVideoUniform, 0);

          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.drawArrays(gl.TRIANGLES, 0, 6);

          if (gl.getError() !== gl.NO_ERROR) {
            throw new Error("WebGL error in drawPassthrough");
          }

          if (!isBackgroundReadyRef.current) {
            isBackgroundReadyRef.current = true;
            setIsBackgroundReady(true);
          }
        } catch (err) {
          console.error("[useConfigureVideoWebGL] drawPassthrough error:", err);
          onFatalErrorRef.current?.();
          return;
        }
      }

      passthroughRafId = requestAnimationFrame(drawPassthrough);
    };

    passthroughRafId = requestAnimationFrame(drawPassthrough);

    // ─── Main Render Loop ───────────────────────────────────────────────────

    const processFrame = (): void => {
      if (!isRunning || !imageSegmenter || !segInputCtx) return;
      if (!video || video.ended || video.readyState < 2) return;
      if (video.paused) {
        void video.play().catch(() => {});
        return;
      }

      const now = performance.now();
      if (now - lastFrameTimeRef.current < frameTargetMs) return;
      lastFrameTimeRef.current = now;

      const vw = video.videoWidth || canvasWidth;
      const vh = video.videoHeight || canvasHeight;

      try {
        if (mainCanvas.width !== vw || mainCanvas.height !== vh) {
          mainCanvas.width = vw;
          mainCanvas.height = vh;
          
          // Re-allocate FBOs if video aspect ratio/resolution changes dramatically
          blurW = Math.max(1, Math.round(vw / 4));
          blurH = Math.max(1, Math.round(vh / 4));
          gl.deleteFramebuffer(fbo1.fbo);
          gl.deleteTexture(fbo1.tex);
          gl.deleteFramebuffer(fbo2.fbo);
          gl.deleteTexture(fbo2.tex);
          fbo1 = createFBO(blurW, blurH);
          fbo2 = createFBO(blurW, blurH);
        }

        // Fast path: no effects
        if (bgEffectsRef.current === bgEffects.none) {
          gl.viewport(0, 0, vw, vh);
          gl.bindTexture(gl.TEXTURE_2D, videoTex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

          gl.useProgram(compProgram);
          gl.uniform1i(compBgEffectUniform, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
          gl.enableVertexAttribArray(compPosLoc);
          gl.vertexAttribPointer(compPosLoc, 2, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
          gl.enableVertexAttribArray(compTexLoc);
          gl.vertexAttribPointer(compTexLoc, 2, gl.FLOAT, false, 0, 0);

          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, videoTex);
          gl.uniform1i(compVideoUniform, 0);

          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.drawArrays(gl.TRIANGLES, 0, 6);

          if (!isBackgroundReadyRef.current) {
            isBackgroundReadyRef.current = true;
            setIsBackgroundReady(true);
          }
          return;
        }

        // ── Segmentation ──
        segInputCtx.drawImage(video, 0, 0, SEGMENTATION_WIDTH, SEGMENTATION_HEIGHT);

        let result;
        try {
          result = imageSegmenter.segmentForVideo(segInputCanvas, now);
        } catch (err) {
          console.error("[useConfigureVideoWebGL] segmentForVideo error:", err);
          return;
        }

        if (!result?.categoryMask && (!result?.confidenceMasks || result.confidenceMasks.length === 0)) {
          result?.close();
          return;
        }

        let float32: Float32Array | undefined;
        let maskW = SEGMENTATION_WIDTH;
        let maskH = SEGMENTATION_HEIGHT;

        if (result.confidenceMasks && result.confidenceMasks.length > 0) {
          const maskIndex = result.confidenceMasks.length > 1 ? 1 : 0;
          const maskObj = result.confidenceMasks[maskIndex];
          maskW = maskObj.width;
          maskH = maskObj.height;
          const maskData = maskObj.getAsFloat32Array();
          if (float32Buf.length < maskData.length) {
            float32Buf = new Float32Array(maskData.length);
          }
          float32Buf.set(maskData);
          float32 = float32Buf;
        } else if (result.categoryMask) {
          maskW = result.categoryMask.width;
          maskH = result.categoryMask.height;
          const catData = result.categoryMask.getAsFloat32Array();
          if (float32Buf.length < catData.length) {
            float32Buf = new Float32Array(catData.length);
          }
          float32Buf.set(catData);
          float32 = float32Buf;
        }

        result.close();
        if (!float32) return;

        // Detect normalization: [0,1] vs [0,255]
        let isNormalized = true;
        const sampleStride = Math.max(1, Math.floor(float32.length / 200));
        for (let i = 0; i < float32.length; i += sampleStride) {
          if (float32[i] > 1.0) { isNormalized = false; break; }
        }

        // Convert float32 → uint8 for R8 texture (guarantees LINEAR on all GPUs)
        const totalPx = maskW * maskH;
        if (maskUint8.length < totalPx) maskUint8 = new Uint8Array(totalPx);
        for (let i = 0; i < totalPx; i++) {
          const v = isNormalized ? float32[i] : float32[i] / 255.0;
          maskUint8[i] = (v * 255 + 0.5) | 0; // fast round
        }

        // Upload Textures
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, videoTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, maskTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, maskW, maskH, 0, gl.RED, gl.UNSIGNED_BYTE, maskUint8.subarray(0, totalPx));

        // Handle Background Image Upload
        if (bgEffectsRef.current === bgEffects.img) {
          const img = imgRef.current;
          if (img && img.naturalWidth > 0 && imageURLRef.current !== uploadedBgImageUrl) {
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, bgImageTex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            uploadedBgImageUrl = imageURLRef.current || "";
          }
        }

        // ── Blur Background ──
        if (bgEffectsRef.current === bgEffects.blur) {
          gl.useProgram(blurProgram);
          gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
          gl.enableVertexAttribArray(blurPosLoc);
          gl.vertexAttribPointer(blurPosLoc, 2, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
          gl.enableVertexAttribArray(blurTexLoc);
          gl.vertexAttribPointer(blurTexLoc, 2, gl.FLOAT, false, 0, 0);

          gl.viewport(0, 0, blurW, blurH);

          // Pass 1: Horizontal Blur (Video -> FBO1)
          gl.bindFramebuffer(gl.FRAMEBUFFER, fbo1.fbo);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, videoTex);
          gl.uniform1i(blurImageUniform, 0);
          gl.uniform2f(blurDirUniform, 1.0 / blurW, 0.0);
          gl.drawArrays(gl.TRIANGLES, 0, 6);

          // Pass 2: Vertical Blur (FBO1 -> FBO2)
          gl.bindFramebuffer(gl.FRAMEBUFFER, fbo2.fbo);
          gl.bindTexture(gl.TEXTURE_2D, fbo1.tex);
          gl.uniform2f(blurDirUniform, 0.0, 1.0 / blurH);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
          
          // Pass 3: Horizontal Blur (FBO2 -> FBO1) for extra smoothness
          gl.bindFramebuffer(gl.FRAMEBUFFER, fbo1.fbo);
          gl.bindTexture(gl.TEXTURE_2D, fbo2.tex);
          gl.uniform2f(blurDirUniform, 2.0 / blurW, 0.0);
          gl.drawArrays(gl.TRIANGLES, 0, 6);

          // Pass 4: Vertical Blur (FBO1 -> FBO2)
          gl.bindFramebuffer(gl.FRAMEBUFFER, fbo2.fbo);
          gl.bindTexture(gl.TEXTURE_2D, fbo1.tex);
          gl.uniform2f(blurDirUniform, 0.0, 2.0 / blurH);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        // ── Final Composite ──
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, vw, vh);

        gl.useProgram(compProgram);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(compPosLoc);
        gl.vertexAttribPointer(compPosLoc, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.enableVertexAttribArray(compTexLoc);
        gl.vertexAttribPointer(compTexLoc, 2, gl.FLOAT, false, 0, 0);

        gl.uniform1i(compBgEffectUniform, bgEffectsRef.current);
        gl.uniform2f(compMaskTexelUniform, 1.0 / maskW, 1.0 / maskH);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, videoTex);
        gl.uniform1i(compVideoUniform, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, maskTex);
        gl.uniform1i(compMaskUniform, 1);

        gl.activeTexture(gl.TEXTURE2);
        if (bgEffectsRef.current === bgEffects.blur) {
          gl.bindTexture(gl.TEXTURE_2D, fbo2.tex);
        } else {
          gl.bindTexture(gl.TEXTURE_2D, bgImageTex);
        }
        gl.uniform1i(compBgUniform, 2);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        if (gl.getError() !== gl.NO_ERROR) {
          throw new Error("WebGL error during composite");
        }

        if (!isBackgroundReadyRef.current) {
          isBackgroundReadyRef.current = true;
          setIsBackgroundReady(true);
        }
      } catch (err) {
        console.error("[useConfigureVideoWebGL] processFrame error:", err);
        onFatalErrorRef.current?.();
      }
    };

    // ─── Loop Management ────────────────────────────────────────────────────

    const stopRAF = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const stopInterval = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const startRAF = () => {
      stopInterval();
      if (rafId !== null) return;
      const loop = () => {
        if (!isRunning) return;
        processFrame();
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    };

    const startIntervalFallback = () => {
      stopRAF();
      if (intervalId !== null) return;
      intervalId = setInterval(() => {
        processFrame();
      }, backgroundIntervalMs);
    };

    const onVisibilityChange = () => {
      if (document.hidden) startIntervalFallback();
      else startRAF();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    // ─── Init ───────────────────────────────────────────────────────────────

    const fallbackToPassthrough = (): void => {
      console.warn("[useConfigureVideoWebGL] Segmentation unavailable.");
      if (!isBackgroundReadyRef.current) {
        isBackgroundReadyRef.current = true;
        setIsBackgroundReady(true);
      }
    };

    const init = async (): Promise<void> => {
      let vision;
      try {
        vision = await FilesetResolver.forVisionTasks(TASKS_VISION_WASM_CDN);
      } catch (err) {
        console.error("[useConfigureVideoWebGL] FilesetResolver failed:", err);
        fallbackToPassthrough();
        onFatalErrorRef.current?.();
        return;
      }

      if (!isRunning) return;

      const delegates: ReadonlyArray<"GPU" | "CPU"> = isSafari ? ["CPU"] : ["GPU", "CPU"];
      let initialized = false;

      for (const delegate of delegates) {
        try {
          imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: SELFIE_SEGMENTATION_MODEL_URL,
              delegate,
            },
            outputCategoryMask: false,
            outputConfidenceMasks: true,
            runningMode: "VIDEO",
          });
          initialized = true;
          break;
        } catch (err) {
          console.warn(`[useConfigureVideoWebGL] ${delegate} delegate failed`);
        }
      }

      if (!initialized) {
        fallbackToPassthrough();
        onFatalErrorRef.current?.();
        return;
      }

      if (!isRunning) {
        imageSegmenter?.close();
        imageSegmenter = null;
        return;
      }

      if (passthroughRafId !== null) {
        cancelAnimationFrame(passthroughRafId);
        passthroughRafId = null;
      }

      if (document.hidden) startIntervalFallback();
      else startRAF();
    };

    void init();

    return () => {
      isRunning = false;
      if (passthroughRafId !== null) cancelAnimationFrame(passthroughRafId);
      stopRAF();
      stopInterval();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      mainCanvas.removeEventListener('webglcontextlost', onContextLost);
      
      imageSegmenter?.close();
      imageSegmenter = null;

      try { video.pause(); } catch {}
      video.srcObject = null;

      segInputCanvas.width = segInputCanvas.height = 0;
      
      // Cleanup WebGL resources
      gl.deleteTexture(videoTex);
      gl.deleteTexture(maskTex);
      gl.deleteTexture(bgImageTex);
      gl.deleteFramebuffer(fbo1.fbo);
      gl.deleteTexture(fbo1.tex);
      gl.deleteFramebuffer(fbo2.fbo);
      gl.deleteTexture(fbo2.tex);
      gl.deleteProgram(blurProgram);
      gl.deleteProgram(compProgram);
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(texCoordBuffer);
      
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    };
  }, [myOriginalStream]);

  return {
    setImageURL,
    setWithBlur,
    imageURL,
    withBlur,
    videoRef,
    imgRef,
    canvasRef,
    isBackgroundReady,
  };
};
