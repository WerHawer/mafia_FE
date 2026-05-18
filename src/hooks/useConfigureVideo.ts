import { FilesetResolver, ImageSegmenter } from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from "react";

import { QualitySettings } from "@/config/video.ts";
import { UserVideoSettings } from "@/types/user.types.ts";

/**
 * Input resolution fed to the segmentation model.
 * Kept small — the model operates at ~256x144 internally.
 */
const SEGMENTATION_WIDTH = 256;
const SEGMENTATION_HEIGHT = 144;

/**
 * WASM runtime CDN for @mediapipe/tasks-vision.
 * Pinned to match the installed package version.
 */
const TASKS_VISION_WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm";

/**
 * Landscape selfie segmentation model — optimised for webcam (16:9) orientation.
 */
const SELFIE_SEGMENTATION_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter_landscape/float16/latest/selfie_segmenter_landscape.tflite";

/**
 * CSS filter applied to the segmentation mask before alpha compositing.
 * Only used when supportsCanvasFilter === true (Chrome, Firefox, modern Edge).
 * Safari fallback uses the software pipeline below.
 */
const MASK_EDGE_FEATHER_PX = 3;
const MASK_SHARPEN_CONTRAST = 200; // percent, for CSS string
const MASK_CONTRACT_BRIGHTNESS = 0.97;
// blur-first then contrast: feathers the edge, then contracts it inward — eliminates the bright halo
const MASK_FILTER = `blur(${MASK_EDGE_FEATHER_PX}px) contrast(${MASK_SHARPEN_CONTRAST}%) brightness(${MASK_CONTRACT_BRIGHTNESS})`;

/**
 * Downscale factor for the software mask-blur fallback.
 * Drawing maskCanvas at 1/MASK_BLUR_SCALE then upscaling back approximates
 * a ~5 px Gaussian via bilinear interpolation — no pixel-loop needed.
 */
const MASK_BLUR_SCALE = 5;
const MASK_BLUR_W = Math.max(
  1,
  Math.round(SEGMENTATION_WIDTH / MASK_BLUR_SCALE)
);
const MASK_BLUR_H = Math.max(
  1,
  Math.round(SEGMENTATION_HEIGHT / MASK_BLUR_SCALE)
);

const bgEffects = {
  blur: "blur",
  img: "img",
  none: "none",
} as const;

type BackgroundEffects = keyof typeof bgEffects;

// ─── Canvas filter feature detection ────────────────────────────────────────
//
// Safari on iOS < 17 and some Android WebViews silently ignore ctx.filter:
// the property is set but the getter returns "none" or "" instead of the
// assigned value. We probe once at module load — no per-frame overhead.
//
// Affected operations when supportsCanvasFilter === false:
//   • MASK_FILTER (contrast + brightness + blur on the grayscale mask)
//   • blur(20px) background effect
//   • contrast/brightness enhancement in the raw-video fallback path
//
// Each has a dedicated software fallback below.
const supportsCanvasFilter = (() => {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    ctx.filter = "blur(1px)";
    const value = ctx.filter;
    // Older Safari / WebViews: undefined or reset to "none"/"" → unsupported.
    return typeof value === "string" && value !== "" && value !== "none";
  } catch {
    return false;
  }
})();

// ─── Safari / WebKit runtime detection ──────────────────────────────────────
//
// MediaPipe's WebGL (GPU) delegate has known issues on WebKit-based browsers:
// the segmentation post-processor logs "NONE activation function chosen on
// GPU" and frequently returns a degenerate confidence mask (all 1.0), which
// renders as "person covers everything → background invisible".
//
// We force the CPU delegate on Safari and skip GPU entirely. CPU runs through
// WASM and is reliable across all platforms. Chrome / Firefox / Edge keep the
// "GPU first, CPU fallback" order for best performance.
const isSafari = (() => {
  try {
    const ua = navigator.userAgent;
    // Excludes Chrome on iOS (CriOS), Firefox on iOS (FxiOS), Edge / Opera
    // forks, and Android (whose browsers may also include "Safari" in the UA).
    return /AppleWebKit/i.test(ua)
      && /Safari/i.test(ua)
      && !/Chrome|Chromium|CriOS|FxiOS|EdgiOS|Edg\/|OPR\/|Android/i.test(ua);
  } catch {
    return false;
  }
})();

export const useConfigureVideo = (
  videoSettings: UserVideoSettings,
  myOriginalStream: MediaStream | null,
  qualitySettings?: QualitySettings
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
  // Guards the one-shot mask diagnostic so it only fires once per stream lifecycle.
  const diagLoggedRef = useRef(false);
  const withoutEffects = !imageURL && !withBlur;
  const [isBackgroundReady, setIsBackgroundReady] = useState(withoutEffects);
  const isBackgroundReadyRef = useRef(withoutEffects);

  // Keeps bgEffectsRef in sync with React state so the render loop always
  // reads the current background mode without depending on stale closures.
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

    // Re-arm the one-shot diagnostic for each new stream so we get a fresh
    // mask sample (helps when the user changes camera / quality).
    diagLoggedRef.current = false;

    const video = videoRef.current;
    if (!video) return;

    video.srcObject = myOriginalStream;
    video.muted = true;
    video.playsInline = true;

    void video.play().catch((err) => {
      console.error("[useConfigureVideo] Failed to play video:", err);
    });

    let isRunning = true;
    let imageSegmenter: ImageSegmenter | null = null;
    let rafId: number | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let passthroughRafId: number | null = null;

    // ── Offscreen canvases ────────────────────────────────────────────────────

    // Downscaled input fed to the segmentation model (reduces Float32 loop by ~8×)
    const segInputCanvas = document.createElement("canvas");
    segInputCanvas.width = SEGMENTATION_WIDTH;
    segInputCanvas.height = SEGMENTATION_HEIGHT;
    const segInputCtx = segInputCanvas.getContext("2d");

    // Grayscale mask canvas used for alpha compositing
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = SEGMENTATION_WIDTH;
    maskCanvas.height = SEGMENTATION_HEIGHT;
    const maskCtx = maskCanvas.getContext("2d");

    // Pre-allocated RGBA buffer — avoids per-frame GC pressure.
    const maskRgba = new Uint8ClampedArray(
      SEGMENTATION_WIDTH * SEGMENTATION_HEIGHT * 4
    );
    for (let i = 3; i < maskRgba.length; i += 4) maskRgba[i] = 255;

    // Pre-allocated ImageData wrapper — avoids one allocation per frame.
    // The wrapper aliases `maskRgba`, so mutations to the array propagate.
    const maskImageData = new ImageData(
      maskRgba,
      SEGMENTATION_WIDTH,
      SEGMENTATION_HEIGHT
    );

    // Pre-allocated Float32 buffer for mask data copied from the WASM heap.
    // Without this, `new Float32Array(getAsFloat32Array())` allocates 144 KB
    // on every frame — at 24 fps that is ~3.4 MB/s of garbage for the GC,
    // which causes visible frame-drops (10–50 ms pauses) on mobile devices.
    const float32Buf = new Float32Array(
      SEGMENTATION_WIDTH * SEGMENTATION_HEIGHT
    );

    // ── Software mask-blur fallback (Safari / old Android WebViews) ───────────
    //
    // When ctx.filter is unavailable we cannot apply MASK_FILTER in one call.
    // Instead we:
    //   1. Bake contrast + brightness directly into maskRgba during the pixel loop.
    //   2. Put the processed pixels to maskCanvas.
    //   3. Draw maskCanvas → maskBlurCanvas (1/6 size) → maskCanvas (full size).
    //      Bilinear interpolation during the upscale acts as a cheap box-blur,
    //      approximating the blur(5px) component without any pixel-loop overhead.
    const maskBlurCanvas = document.createElement("canvas");
    maskBlurCanvas.width = MASK_BLUR_W;
    maskBlurCanvas.height = MASK_BLUR_H;
    const maskBlurCtx = maskBlurCanvas.getContext("2d");

    // ── Isolated mask-filter canvas (cross-browser safety) ────────────────────
    //
    // Even when ctx.filter is supported, Safari/WebKit shows rendering glitches
    // when ctx.filter is combined with non-default globalCompositeOperation on
    // the SAME context (the person disappears or the background isn't drawn).
    // To avoid that interaction we apply MASK_FILTER on this dedicated context
    // (composite always at default "source-over") and then blit the result onto
    // compCanvas without any filter set there.
    //
    // Sized to match the live video (vw × vh) so MASK_FILTER's blur(3px) is in
    // destination pixels — keeps the original edge sharpness. If the filter
    // ran at SEGMENTATION resolution (256 × 144), the 3 px blur would be
    // proportionally ~3× wider and produce a translucent "ghost" silhouette
    // when subsequently scaled up.
    const maskFilteredCanvas = document.createElement("canvas");
    maskFilteredCanvas.width = canvasWidth;
    maskFilteredCanvas.height = canvasHeight;
    let maskFilteredCtx = maskFilteredCanvas.getContext("2d");

    // ── Person cut-out canvas (Safari compositing safety) ─────────────────────
    //
    // Each canvas in our pipeline does AT MOST one custom globalCompositeOperation.
    // Safari/WebKit ships a known bug where chaining `source-in` followed by
    // `destination-over` on the same context produces a frame with either the
    // background or the person missing. Isolating the cut-out step on this
    // canvas (only "source-in" runs here) and keeping compCanvas at default
    // "source-over" sidesteps that interaction entirely.
    const personCanvas = document.createElement("canvas");
    personCanvas.width = canvasWidth;
    personCanvas.height = canvasHeight;
    let personCtx = personCanvas.getContext("2d", { alpha: true });

    // ── Software background-blur fallback ─────────────────────────────────────
    //
    // Canvas filter "blur(20px)" fails on Safari. Drawing the video frame at
    // 1/8 resolution and stretching it back to full size gives a naturally soft,
    // pixelated look that's visually close enough and fully cross-browser.
    // Pre-allocated here to avoid per-frame canvas creation / GC pressure.
    const bgBlurCanvas = document.createElement("canvas");
    bgBlurCanvas.width = Math.max(1, Math.round(canvasWidth / 8));
    bgBlurCanvas.height = Math.max(1, Math.round(canvasHeight / 8));
    const bgBlurCtx = bgBlurCanvas.getContext("2d");

    // ── Isolated bg-filter canvas (GPU blur path) ─────────────────────────────
    //
    // Same Safari rationale as maskFilteredCanvas: apply blur/brightness/saturate
    // on a dedicated context (no composite changes here) so compCanvas can then
    // do destination-over without any active filter.
    // Resized lazily inside processFrame to match the live video dimensions.
    const bgFilterCanvas = document.createElement("canvas");
    bgFilterCanvas.width = canvasWidth;
    bgFilterCanvas.height = canvasHeight;
    let bgFilterCtx = bgFilterCanvas.getContext("2d");

    // All mask/person/background layering happens in normal (non-mirrored) space.
    // The result is blitted to mainCanvas with a horizontal mirror at the end.
    const compCanvas = document.createElement("canvas");
    compCanvas.width = canvasWidth;
    compCanvas.height = canvasHeight;
    let compCtx = compCanvas.getContext("2d", { alpha: true });

    // Cached main-canvas context — avoids calling getContext() on every frame.
    // Nulled out whenever the canvas is resized (resize forces a new context object).
    let mainCtx: CanvasRenderingContext2D | null = null;

    // ── Passthrough loop ──────────────────────────────────────────────────────
    //
    // Renders raw video while the WASM runtime / model downloads (3–8 s).
    // Stops automatically once imageSegmenter is ready.

    const drawPassthrough = (): void => {
      if (!isRunning || imageSegmenter) return;

      const mainCanvas = canvasRef.current;
      if (mainCanvas && video.readyState >= 2 && video.videoWidth > 0) {
        const vw = video.videoWidth;
        const vh = video.videoHeight;

        if (mainCanvas.width !== vw || mainCanvas.height !== vh) {
          mainCanvas.width = vw;
          mainCanvas.height = vh;
          mainCtx = null; // invalidate cached ctx on resize
        }

        if (!mainCtx) mainCtx = mainCanvas.getContext("2d");

        if (mainCtx && !video.paused && video.readyState >= 2) {
          // Always draw the mirrored raw video regardless of the chosen effect.
          // If the segmenter is still loading (3–8 s) or has permanently failed
          // (Safari with no GPU/CPU delegate available), we still need to push
          // visible frames into the captureStream so peers see us at all.
          mainCtx.clearRect(0, 0, vw, vh);
          mainCtx.save();
          mainCtx.translate(vw, 0);
          mainCtx.scale(-1, 1);
          mainCtx.drawImage(video, 0, 0, vw, vh);
          mainCtx.restore();

          if (!isBackgroundReadyRef.current) {
            isBackgroundReadyRef.current = true;
            setIsBackgroundReady(true);
          }
        }
      }

      passthroughRafId = requestAnimationFrame(drawPassthrough);
    };

    passthroughRafId = requestAnimationFrame(drawPassthrough);

    // ── processFrame ──────────────────────────────────────────────────────────

    const processFrame = (): void => {
      if (!isRunning || !imageSegmenter || !segInputCtx || !maskCtx) return;
      if (!video || video.paused || video.ended || video.readyState < 2) return;

      const now = performance.now();
      if (now - lastFrameTimeRef.current < frameTargetMs) return;
      lastFrameTimeRef.current = now;

      const mainCanvas = canvasRef.current;
      if (!mainCanvas) return;

      const vw = video.videoWidth || canvasWidth;
      const vh = video.videoHeight || canvasHeight;

      // ── Fast path: no effects ─────────────────────────────────────────────
      if (bgEffectsRef.current === bgEffects.none) {
        if (mainCanvas.width !== vw || mainCanvas.height !== vh) {
          mainCanvas.width = vw;
          mainCanvas.height = vh;
          mainCtx = null;
        }

        if (!mainCtx) mainCtx = mainCanvas.getContext("2d");

        if (mainCtx) {
          mainCtx.clearRect(0, 0, vw, vh);
          mainCtx.save();
          mainCtx.translate(vw, 0);
          mainCtx.scale(-1, 1);
          mainCtx.drawImage(video, 0, 0, vw, vh);
          mainCtx.restore();
        }

        if (!isBackgroundReadyRef.current) {
          isBackgroundReadyRef.current = true;
          setIsBackgroundReady(true);
        }
        return;
      }

      // ── Segmentation ──────────────────────────────────────────────────────
      // No clearRect: drawImage at full canvas size overwrites every pixel.
      segInputCtx.drawImage(
        video,
        0,
        0,
        SEGMENTATION_WIDTH,
        SEGMENTATION_HEIGHT
      );

      let result;
      try {
        result = imageSegmenter.segmentForVideo(segInputCanvas, now);
      } catch (err) {
        console.error("[useConfigureVideo] segmentForVideo error:", err);
        return;
      }

      if (
        !result?.categoryMask &&
        (!result?.confidenceMasks || result.confidenceMasks.length === 0)
      ) {
        result?.close();
        return;
      }

      // ── Copy mask data into the pre-allocated buffer, then close result ──────
      //
      // getAsFloat32Array() returns a VIEW into the WASM heap — the underlying
      // memory is owned by `result` and becomes invalid the moment result.close()
      // is called. We copy into `float32Buf` (allocated once, outside the loop)
      // instead of `new Float32Array(...)` to avoid 144 KB of GC garbage per frame
      // (~3.4 MB/s at 24 fps — a common cause of jank on mobile).
      let float32: Float32Array | undefined;

      if (result.confidenceMasks && result.confidenceMasks.length > 0) {
        // Index 1 = person confidence; index 0 = background confidence
        const maskIndex = result.confidenceMasks.length > 1 ? 1 : 0;
        const view = result.confidenceMasks[maskIndex].getAsFloat32Array();
        float32Buf.set(view); // zero-copy into pre-allocated buffer
        float32 = float32Buf;
      } else if (result.categoryMask) {
        const view = result.categoryMask.getAsFloat32Array();
        float32Buf.set(view);
        float32 = float32Buf;
      }

      // Close WASM result immediately after copying to free heap memory.
      result.close();

      if (!float32) return;

      // Detect normalization: some model versions return [0,1], others [0,255]
      // Sample across the full mask (not just the first 100 px which may all
      // be background) to catch logits-style outputs reliably.
      let isNormalized = true;
      const sampleStride = Math.max(1, Math.floor(float32.length / 200));
      for (let i = 0; i < float32.length; i += sampleStride) {
        if (float32[i] > 1.0) {
          isNormalized = false;
          break;
        }
      }

      // ── One-shot diagnostic ────────────────────────────────────────────────
      // Logs once after the first successful segmentation so we can verify
      // remotely that the mask actually contains a person vs. is degenerate
      // (e.g. uniformly 1.0, which renders as "person covers everything").
      if (!diagLoggedRef.current) {
        diagLoggedRef.current = true;
        let lo = Infinity;
        let hi = -Infinity;
        let mid = 0;
        const probeStride = Math.max(1, Math.floor(float32.length / 500));
        for (let i = 0; i < float32.length; i += probeStride) {
          const v = float32[i];
          if (v < lo) lo = v;
          if (v > hi) hi = v;
          if (v > 0.4 && v < 0.6) mid++;
        }
        console.log(
          `[useConfigureVideo] mask diag — min=${lo.toFixed(3)} max=${hi.toFixed(3)} ` +
          `midband=${mid} normalized=${isNormalized} bg=${bgEffectsRef.current} ` +
          `vw=${vw} vh=${vh} isSafari=${isSafari}`
        );
      }

      // ── Build RGBA mask buffer ────────────────────────────────────────────
      //
      // When ctx.filter is supported: write raw confidence values — the CSS
      // filter chain (contrast → brightness → blur) runs on the GPU later.
      //
      // When ctx.filter is NOT supported (Safari / old WebViews): bake the
      // contrast and brightness transforms directly into each pixel value here,
      // then approximate the blur step via downscale→upscale below.
      for (let i = 0; i < float32.length; i++) {
        const rawVal = isNormalized ? float32[i] * 255 : float32[i];
        let val: number;

        if (!supportsCanvasFilter) {
          // contrast(150%): (x − 0.5) × 1.5 + 0.5, clamped to [0, 1]
          const contrasted =
            ((rawVal / 255 - 0.5) * (MASK_SHARPEN_CONTRAST / 100) + 0.5) * 255;
          // brightness(0.95)
          val = Math.max(
            0,
            Math.min(255, contrasted * MASK_CONTRACT_BRIGHTNESS)
          );
        } else {
          val = rawVal;
        }

        const base = i << 2;
        maskRgba[base] =
          maskRgba[base + 1] =
          maskRgba[base + 2] =
          maskRgba[base + 3] =
            val;
      }

      maskCtx.putImageData(maskImageData, 0, 0);

      // ── Software mask blur (no-filter fallback) ───────────────────────────
      //
      // Replaces the blur(5px) component of MASK_FILTER.
      // Downscale maskCanvas to MASK_BLUR_W×MASK_BLUR_H, then upscale back to
      // SEGMENTATION_WIDTH×SEGMENTATION_HEIGHT. Bilinear interpolation during
      // the upscale spreads edge pixels, approximating Gaussian feathering.
      if (!supportsCanvasFilter && maskBlurCtx) {
        maskBlurCtx.clearRect(0, 0, MASK_BLUR_W, MASK_BLUR_H);
        maskBlurCtx.drawImage(maskCanvas, 0, 0, MASK_BLUR_W, MASK_BLUR_H);
        maskCtx.clearRect(0, 0, SEGMENTATION_WIDTH, SEGMENTATION_HEIGHT);
        maskCtx.drawImage(
          maskBlurCanvas,
          0,
          0,
          SEGMENTATION_WIDTH,
          SEGMENTATION_HEIGHT
        );
      }

      // ── Build the filtered mask at destination size ──────────────────────
      //
      // [Task 2 — "ghost" edge fix]
      // MASK_FILTER must be applied at the destination (video) resolution so
      // its blur(3px)/contrast(200%) operate in destination pixel space. If we
      // ran the filter at SEGMENTATION resolution and then up-scaled the
      // result, the blur radius would be effectively multiplied by the scale
      // factor and bilinear up-scaling would soften the edge once more — that
      // combination is exactly what produced the translucent "ghost" silhouette.
      let maskSource: HTMLCanvasElement = maskCanvas;
      let maskSourceW = SEGMENTATION_WIDTH;
      let maskSourceH = SEGMENTATION_HEIGHT;

      if (supportsCanvasFilter && maskFilteredCtx) {
        if (
          maskFilteredCanvas.width !== vw ||
          maskFilteredCanvas.height !== vh
        ) {
          maskFilteredCanvas.width = vw;
          maskFilteredCanvas.height = vh;
          maskFilteredCtx = maskFilteredCanvas.getContext("2d");
        }

        if (maskFilteredCtx) {
          maskFilteredCtx.clearRect(0, 0, vw, vh);
          maskFilteredCtx.filter = MASK_FILTER;
          maskFilteredCtx.drawImage(maskCanvas, 0, 0, vw, vh);
          maskFilteredCtx.filter = "none";
          maskSource = maskFilteredCanvas;
          maskSourceW = vw;
          maskSourceH = vh;
        }
      }

      // ── Pre-render the blurred background on its own context (GPU path) ──
      //
      // Same Safari rationale as above: keep filter and composite on different
      // contexts. Software path keeps using bgBlurCanvas's downscale trick.
      if (
        bgEffectsRef.current === bgEffects.blur &&
        supportsCanvasFilter &&
        bgFilterCtx
      ) {
        if (bgFilterCanvas.width !== vw || bgFilterCanvas.height !== vh) {
          bgFilterCanvas.width = vw;
          bgFilterCanvas.height = vh;
          bgFilterCtx = bgFilterCanvas.getContext("2d");
        }

        if (bgFilterCtx) {
          bgFilterCtx.filter = "blur(20px) brightness(0.97) saturate(1.1)";
          bgFilterCtx.drawImage(video, 0, 0, vw, vh);
          bgFilterCtx.filter = "none";
        }
      } else if (bgEffectsRef.current === bgEffects.blur && bgBlurCtx) {
        // No-filter path: redraw the downscaled frame so the next compCanvas
        // step reads fresh pixels (canvas is otherwise stale across frames).
        bgBlurCtx.drawImage(
          video,
          0,
          0,
          bgBlurCanvas.width,
          bgBlurCanvas.height
        );
      }

      // ── Cut out the person on a dedicated canvas ─────────────────────────
      //
      // [Task 1 — Safari "no background" fix]
      // personCanvas performs the only custom composite operation in the
      // pipeline. The previous version chained `source-in` and
      // `destination-over` on the same compCanvas, which Safari/WebKit renders
      // inconsistently — the bg either fails to appear at all (blur and image
      // modes alike) or wipes the person out. By splitting them across two
      // canvases each context sees AT MOST one custom
      // globalCompositeOperation per frame.
      //
      // We use `destination-in` (draw the video first, then keep only the
      // pixels where the mask has alpha) rather than the logically-equivalent
      // `source-in` (draw mask first, then video). They produce the same
      // result, but multiple public WebKit bugs trace back to source-in
      // misbehaving with non-square sources; destination-in is more reliable
      // in practice.

      if (personCanvas.width !== vw || personCanvas.height !== vh) {
        personCanvas.width = vw;
        personCanvas.height = vh;
        personCtx = personCanvas.getContext("2d", { alpha: true });
      }

      if (!personCtx) return;

      personCtx.globalCompositeOperation = "source-over";
      personCtx.clearRect(0, 0, vw, vh);
      personCtx.drawImage(video, 0, 0, vw, vh);
      personCtx.globalCompositeOperation = "destination-in";
      personCtx.drawImage(
        maskSource,
        0,
        0,
        maskSourceW,
        maskSourceH,
        0,
        0,
        vw,
        vh
      );
      personCtx.globalCompositeOperation = "source-over"; // reset for next frame

      // ── Layer compositing on compCanvas (default "source-over" only) ─────
      //
      // No custom composite operation is used here — bg goes down first, then
      // the pre-cut person on top. Safari handles this without any filter or
      // composite interaction.

      if (compCanvas.width !== vw || compCanvas.height !== vh) {
        compCanvas.width = vw;
        compCanvas.height = vh;
        compCtx = compCanvas.getContext("2d", { alpha: true });
      }

      if (!compCtx) return;

      const img = imgRef.current;

      compCtx.globalCompositeOperation = "source-over";
      compCtx.filter = "none";
      compCtx.clearRect(0, 0, vw, vh);

      // Step 1: Background
      if (bgEffectsRef.current === bgEffects.blur) {
        if (supportsCanvasFilter) {
          compCtx.drawImage(bgFilterCanvas, 0, 0, vw, vh);
        } else if (bgBlurCtx) {
          compCtx.drawImage(bgBlurCanvas, 0, 0, vw, vh);
        } else {
          compCtx.drawImage(video, 0, 0, vw, vh);
        }

        // Subtle vignette on the mirrored right edge (drawn in unmirrored space
        // so the fillRect intentionally targets negative x coordinates)
        const gradient = compCtx.createRadialGradient(
          -vw / 2,
          vh / 2,
          vh * 0.3,
          -vw / 2,
          vh / 2,
          vh * 0.8
        );
        gradient.addColorStop(0, "rgba(0,0,0,0)");
        gradient.addColorStop(1, "rgba(0,0,0,0.3)");
        compCtx.fillStyle = gradient;
        compCtx.fillRect(-vw, 0, vw, vh);
      } else if (bgEffectsRef.current === bgEffects.img && img) {
        const imgW = img.naturalWidth || img.width;
        const imgH = img.naturalHeight || img.height;

        if (imgW && imgH) {
          const canvasRatio = vw / vh;
          const imgRatio = imgW / imgH;
          let dw: number, dh: number, dx: number, dy: number;

          if (imgRatio < canvasRatio) {
            dw = vw;
            dh = dw / imgRatio;
            dx = 0;
            dy = (vh - dh) / 2;
          } else {
            dh = vh;
            dw = dh * imgRatio;
            dx = (vw - dw) / 2;
            dy = 0;
          }

          compCtx.drawImage(img, dx, dy, dw, dh);
        }
      } else {
        // No effect — just the raw video
        compCtx.drawImage(video, 0, 0, vw, vh);
      }

      // Step 2: Person on top
      compCtx.drawImage(personCanvas, 0, 0);

      // ── Blit compCanvas → mainCanvas with horizontal mirror ───────────────
      //
      // Mirror is applied only at this final step so all compositing above
      // runs in normal coordinate space — avoids source-in / destination-over
      // misbehaviour under a negative scale transform on some GPU drivers.

      if (mainCanvas.width !== vw || mainCanvas.height !== vh) {
        mainCanvas.width = vw;
        mainCanvas.height = vh;
        mainCtx = null;
      }

      if (!mainCtx) mainCtx = mainCanvas.getContext("2d");
      if (!mainCtx) return;

      mainCtx.clearRect(0, 0, vw, vh);
      mainCtx.save();
      mainCtx.translate(vw, 0);
      mainCtx.scale(-1, 1);
      mainCtx.drawImage(compCanvas, 0, 0);
      mainCtx.restore();

      if (!isBackgroundReadyRef.current) {
        isBackgroundReadyRef.current = true;
        setIsBackgroundReady(true);
      }
    };

    // ── Loop management ───────────────────────────────────────────────────────

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

    /**
     * Primary loop — requestAnimationFrame when the tab is visible.
     * GPU-synced, smooth rendering capped by frameTargetMs in processFrame.
     */
    const startRAF = () => {
      stopInterval();
      if (rafId !== null) return;

      const loop = () => {
        if (!isRunning) return;
        try {
          processFrame();
        } catch (err) {
          console.error("[useConfigureVideo] Unhandled frame error:", err);
        }
        rafId = requestAnimationFrame(loop);
      };

      rafId = requestAnimationFrame(loop);
    };

    /**
     * Fallback loop — setInterval when the tab is hidden / window blurred.
     * Keeps the canvas stream alive for remote participants even when throttled.
     */
    const startIntervalFallback = () => {
      stopRAF();
      if (intervalId !== null) return;

      intervalId = setInterval(() => {
        try {
          processFrame();
        } catch (err) {
          console.error(
            "[useConfigureVideo] Unhandled frame error (interval):",
            err
          );
        }
      }, backgroundIntervalMs);
    };

    const onVisibilityChange = () => {
      if (document.hidden) startIntervalFallback();
      else startRAF();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    // ── Init ──────────────────────────────────────────────────────────────────

    /**
     * Switches the hook into permanent passthrough mode when the segmenter
     * cannot be initialised on the current platform. Raw video continues to
     * render; the UI loading state resolves normally.
     */
    const fallbackToPassthrough = (): void => {
      console.warn(
        "[useConfigureVideo] Segmentation unavailable — passthrough mode."
      );
      if (!isBackgroundReadyRef.current) {
        isBackgroundReadyRef.current = true;
        setIsBackgroundReady(true);
      }
    };

    const init = async (): Promise<void> => {
      // ── Step 1: Load WASM runtime ─────────────────────────────────────────
      let vision;
      try {
        vision = await FilesetResolver.forVisionTasks(TASKS_VISION_WASM_CDN);
      } catch (err) {
        console.error("[useConfigureVideo] FilesetResolver failed:", err);
        fallbackToPassthrough();
        return;
      }

      if (!isRunning) return;

      // ── Step 2: Create ImageSegmenter — GPU first, CPU fallback ──────────
      //
      // GPU delegate (WebGL) is significantly faster but fails on:
      //   • Safari / WebKit — `createFromOptions` reports "ready" but the
      //     post-processor (segmentation_postprocessor_gl.cc) frequently
      //     returns a degenerate confidence mask. The end result is that the
      //     mask is effectively "everything is person" and the background
      //     never appears. Skip GPU on Safari entirely.
      //   • Android WebViews — often lack full WebGL support
      //   • Low-end hardware — GPU context creation may be refused
      //
      // CPU delegate is universally supported and is a reliable fallback.
      // We request confidenceMasks only (outputCategoryMask: false) since the
      // pixel loop prefers the float confidence values; this halves the output
      // buffer size and reduces memory pressure on mobile.
      const delegates: ReadonlyArray<"GPU" | "CPU"> = isSafari
        ? ["CPU"]
        : ["GPU", "CPU"];
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

          console.log(
            `[useConfigureVideo] ImageSegmenter ready (delegate: ${delegate}, ` +
              `canvasFilter: ${supportsCanvasFilter})`
          );
          initialized = true;
          break;
        } catch (err) {
          console.warn(
            `[useConfigureVideo] ${delegate} delegate failed` +
              (delegate === "GPU" ? " — retrying with CPU…" : " — giving up."),
            err
          );
        }
      }

      if (!initialized) {
        fallbackToPassthrough();
        return;
      }

      if (!isRunning) {
        imageSegmenter?.close();
        imageSegmenter = null;
        return;
      }

      // Passthrough loop is no longer needed — segmenter is live
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
      imageSegmenter?.close();
      imageSegmenter = null;

      // Release the MediaStream reference so the camera track can be GC'd
      // when the parent unmounts or switches streams (e.g. quality change).
      // Without this Safari keeps the previous capture alive for a few seconds.
      try {
        video.pause();
      } catch {
        // ignore — video may already be detached
      }
      video.srcObject = null;

      // Shrink offscreen canvases to free GPU-backed buffers eagerly.
      // Some browsers (Safari/iOS especially) hold canvas memory until GC,
      // which can balloon when the user toggles streams repeatedly.
      segInputCanvas.width = segInputCanvas.height = 0;
      maskCanvas.width = maskCanvas.height = 0;
      maskBlurCanvas.width = maskBlurCanvas.height = 0;
      maskFilteredCanvas.width = maskFilteredCanvas.height = 0;
      bgBlurCanvas.width = bgBlurCanvas.height = 0;
      bgFilterCanvas.width = bgFilterCanvas.height = 0;
      personCanvas.width = personCanvas.height = 0;
      compCanvas.width = compCanvas.height = 0;
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
