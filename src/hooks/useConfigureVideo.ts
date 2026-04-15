import { FilesetResolver, ImageSegmenter } from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from "react";

import { videoOptions } from "@/config/video.ts";
import { UserVideoSettings } from "@/types/user.types.ts";

const HIGH_VIDEO_WIDTH = videoOptions.width;
const HIGH_VIDEO_HEIGHT = videoOptions.height;

/**
 * Fallback frame interval when RAF is throttled in hidden tabs / blurred windows.
 * setInterval continues running (throttled to ~1fps by browsers) keeping the
 * canvas stream alive for remote participants.
 */
const BACKGROUND_FRAME_INTERVAL_MS = 1000 / 30;

/**
 * Target frame time for the 30fps processing cap.
 */
const FRAME_TARGET_MS = 1000 / 30;

/**
 * Input resolution fed to the segmentation model.
 * The selfie_segmenter_landscape model operates at ~256x144 internally,
 * so 640x360 captures full detail without the cost of feeding 1080p.
 * The resulting mask is scaled up to video resolution at draw time.
 */
const SEGMENTATION_WIDTH = 640;
const SEGMENTATION_HEIGHT = 360;

/**
 * WASM runtime CDN for @mediapipe/tasks-vision.
 * Pinned to match the installed package version.
 */
const TASKS_VISION_WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm";

/**
 * Landscape selfie segmentation model — optimised for webcam (16:9) orientation.
 * Significantly better person/background boundary detection than the older
 * @mediapipe/selfie_segmentation package.
 */
const SELFIE_SEGMENTATION_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter_landscape/float16/latest/selfie_segmenter_landscape.tflite";

/**
 * Composed CSS filter applied to the segmentation mask before alpha compositing:
 *   1. contrast  — sharpens the raw mask toward black/white, reducing uncertain edges
 *   2. brightness — slightly contracts the person region to reduce background bleed
 *                   (e.g. chair backs / walls that border the silhouette)
 *   3. blur      — feathers the sharpened boundary for a smooth, natural transition
 * Order is significant: contrast/brightness run on the sharp mask, then blur
 * spreads only the outermost edge ring.
 */
const MASK_EDGE_FEATHER_PX = 5;
const MASK_SHARPEN_CONTRAST = 150;
const MASK_CONTRACT_BRIGHTNESS = 0.95;
const MASK_FILTER = `contrast(${MASK_SHARPEN_CONTRAST}%) brightness(${MASK_CONTRACT_BRIGHTNESS}) blur(${MASK_EDGE_FEATHER_PX}px)`;

const bgEffects = {
  blur: "blur",
  img: "img",
  none: "none",
} as const;

type BackgroundEffects = keyof typeof bgEffects;

export const useConfigureVideo = (
  videoSettings: UserVideoSettings,
  myOriginalStream: MediaStream | null
) => {
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

    const video = videoRef.current;

    if (!video) return;

    video.srcObject = myOriginalStream;
    video.muted = true;
    video.playsInline = true;

    // Start playing immediately — do NOT wait for the async segmenter init.
    // This ensures the video element is live before the WASM runtime loads.
    void video.play().catch((err) => {
      console.error("[useConfigureVideo] Failed to play video:", err);
    });

    let isRunning = true;
    let imageSegmenter: ImageSegmenter | null = null;
    let rafId: number | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let passthroughRafId: number | null = null;

    // Downscaled canvas fed to the segmentation model.
    // Reduces the Float32→RGBA pixel loop from ~2M iterations (1080p) to ~230k.
    const segInputCanvas = document.createElement("canvas");
    segInputCanvas.width = SEGMENTATION_WIDTH;
    segInputCanvas.height = SEGMENTATION_HEIGHT;
    const segInputCtx = segInputCanvas.getContext("2d");

    // Offscreen canvas that stores the grayscale mask for compositing.
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = SEGMENTATION_WIDTH;
    maskCanvas.height = SEGMENTATION_HEIGHT;
    const maskCtx = maskCanvas.getContext("2d");

    // Pre-allocated RGBA buffer — avoids per-frame GC pressure.
    // Alpha channel pre-filled to 255; only R/G/B are updated each frame.
    const maskRgba = new Uint8ClampedArray(
      SEGMENTATION_WIDTH * SEGMENTATION_HEIGHT * 4
    );

    for (let i = 3; i < maskRgba.length; i += 4) {
      maskRgba[i] = 255;
    }

    /**
     * Compositing canvas — all mask/person/background layering happens here in normal
     * (non-mirrored) coordinate space. The finished result is then blitted to mainCanvas
     * with a horizontal mirror transform. Keeping compositing and mirroring separate
     * avoids source-in / destination-over misbehaviour under a negative scale transform
     * that occurs on some GPU drivers / browsers.
     */
    const compCanvas = document.createElement("canvas");
    compCanvas.width = HIGH_VIDEO_WIDTH;
    compCanvas.height = HIGH_VIDEO_HEIGHT;
    let compCtx = compCanvas.getContext("2d", { alpha: true });

    /**
     * Passthrough loop: renders raw video directly to canvas while the segmenter
     * WASM runtime is still downloading / initialising.
     * Ensures the canvas stream and preview are visible immediately instead of
     * showing a black frame for the 3–8 seconds the model takes to load.
     * Stops automatically once imageSegmenter is ready.
     */
    const drawPassthrough = (): void => {
      if (!isRunning || imageSegmenter) return;

      const mainCanvas = canvasRef.current;

      if (mainCanvas && video.readyState >= 2 && video.videoWidth > 0) {
        const vw = video.videoWidth;
        const vh = video.videoHeight;

        if (mainCanvas.width !== vw || mainCanvas.height !== vh) {
          mainCanvas.width = vw;
          mainCanvas.height = vh;
        }

        const ctx = mainCanvas.getContext("2d");

        if (ctx && !video.paused && video.readyState >= 2) {
          ctx.clearRect(0, 0, vw, vh);

          if (bgEffectsRef.current === bgEffects.none) {
            // Mirror horizontally so the preview matches webcam selfie convention
            ctx.save();
            ctx.translate(vw, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0, vw, vh);
            ctx.restore();

            if (!isBackgroundReadyRef.current) {
              isBackgroundReadyRef.current = true;
              setIsBackgroundReady(true);
            }
          }
        }
      }

      passthroughRafId = requestAnimationFrame(drawPassthrough);
    };

    passthroughRafId = requestAnimationFrame(drawPassthrough);

    const processFrame = (): void => {
      if (!isRunning || !imageSegmenter || !segInputCtx || !maskCtx) return;

      if (!video || video.paused || video.ended || video.readyState < 2) return;

      const now = performance.now();

      if (now - lastFrameTimeRef.current < FRAME_TARGET_MS) return;

      lastFrameTimeRef.current = now;

      const mainCanvas = canvasRef.current;

      if (!mainCanvas) return;

      const vw = video.videoWidth || HIGH_VIDEO_WIDTH;
      const vh = video.videoHeight || HIGH_VIDEO_HEIGHT;

      // Clear before draw to prevent stale pixel bleed on aspect-ratio mismatches
      segInputCtx.clearRect(0, 0, SEGMENTATION_WIDTH, SEGMENTATION_HEIGHT);
      // Scale video frame down to segmentation input resolution
      segInputCtx.drawImage(
        video,
        0,
        0,
        SEGMENTATION_WIDTH,
        SEGMENTATION_HEIGHT
      );

      // Synchronous segmentation — core advantage over the old @mediapipe/selfie_segmentation
      // async callback API (which required an isProcessingFrame guard and had latency).
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

      // getAsFloat32Array() returns confidence masks [0.0, 1.0]
      let float32: Float32Array | undefined;

      if (result.confidenceMasks && result.confidenceMasks.length > 0) {
        const maskIndex = result.confidenceMasks.length > 1 ? 1 : 0;
        float32 = result.confidenceMasks[maskIndex].getAsFloat32Array();
      } else if (result.categoryMask) {
        float32 = result.categoryMask.getAsFloat32Array();
      }

      if (!float32) {
        result?.close();
        return;
      }

      // Some versions of the model return 0-255 raw bytes, others 0.0-1.0 floats.
      let isNormalized = true;
      for (let i = 0; i < 100 && i < float32.length; i += 10) {
        if (float32[i] > 1.0) {
          isNormalized = false;
          break;
        }
      }

      for (let i = 0; i < float32.length; i++) {
        const val = isNormalized ? float32[i] * 255 : float32[i];

        const base = i << 2;
        maskRgba[base] = val;
        maskRgba[base + 1] = val;
        maskRgba[base + 2] = val;

        // CRITICAL BUG FIX: The alpha channel must be 'val' as well, otherwise
        // the mask is always completely opaque, which breaks 'source-in' compositing.
        maskRgba[base + 3] = val;
      }

      maskCtx.putImageData(
        new ImageData(maskRgba, SEGMENTATION_WIDTH, SEGMENTATION_HEIGHT),
        0,
        0
      );

      result.close();

      // Sync compCanvas dimensions to actual video dimensions
      if (compCanvas.width !== vw || compCanvas.height !== vh) {
        compCanvas.width = vw;
        compCanvas.height = vh;
        compCtx = compCanvas.getContext("2d", { alpha: true });
      }

      if (!compCtx) return;

      const img = imgRef.current;

      // ── Compositing on compCanvas (normal / non-mirrored coordinate space) ──────────
      compCtx.clearRect(0, 0, vw, vh);

      // Step 1: Draw feathered mask, scaled from segmentation to full video resolution
      compCtx.filter = MASK_FILTER;
      compCtx.drawImage(maskCanvas, 0, 0, vw, vh);

      // Step 2: Cut out person using the mask as an alpha channel
      compCtx.globalCompositeOperation = "source-in";
      compCtx.filter = "none";
      compCtx.drawImage(video, 0, 0, vw, vh);

      if (bgEffectsRef.current === bgEffects.blur) {
        // Step 3a: Blurred copy of the video composited behind the person
        compCtx.globalCompositeOperation = "destination-over";
        compCtx.filter = "blur(20px) brightness(0.97) saturate(1.1)";
        compCtx.drawImage(video, 0, 0, vw, vh);

        compCtx.globalCompositeOperation = "source-over";
        compCtx.filter = "none";
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
        // Step 3b: Custom image cover-scaled behind the person
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

          compCtx.globalCompositeOperation = "destination-over";
          compCtx.filter = "none";
          compCtx.drawImage(img, dx, dy, dw, dh);
        }
      } else {
        // Step 3c: Raw video as background with a subtle enhancement pass
        compCtx.globalCompositeOperation = "destination-over";
        compCtx.filter = "none";
        compCtx.drawImage(video, 0, 0, vw, vh);

        compCtx.globalCompositeOperation = "source-over";
        compCtx.filter = "contrast(1.05) brightness(1.02)";
        compCtx.globalAlpha = 0.2;
        compCtx.drawImage(video, 0, 0, vw, vh);
        compCtx.globalAlpha = 1.0;
      }

      // Reset compositing state
      compCtx.globalCompositeOperation = "source-over";
      compCtx.filter = "none";
      // ── End compositing ──────────────────────────────────────────────────────────────

      // Resize main canvas if needed
      if (mainCanvas.width !== vw || mainCanvas.height !== vh) {
        mainCanvas.width = vw;
        mainCanvas.height = vh;
      }

      const ctx = mainCanvas.getContext("2d", {
        desynchronized: true,
        alpha: true,
        willReadFrequently: false,
      });

      if (!ctx) return;

      // Blit compCanvas → mainCanvas with horizontal mirror for selfie convention.
      // Doing the mirror ONLY at this final step keeps all compositing in normal space,
      // avoiding source-in / destination-over issues under a negative scale transform.
      ctx.clearRect(0, 0, vw, vh);
      ctx.save();
      ctx.translate(vw, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(compCanvas, 0, 0);
      ctx.restore();

      if (!isBackgroundReadyRef.current) {
        isBackgroundReadyRef.current = true;
        setIsBackgroundReady(true);
      }
    };

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
     * GPU-synced, smooth 30fps (capped by lastFrameTimeRef check in processFrame).
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
     * Fallback loop — setInterval when RAF is throttled (hidden tab / blurred window).
     * Browsers throttle setInterval to ~1fps in hidden tabs but don't stop it entirely,
     * keeping the canvas stream alive for remote participants.
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
      }, BACKGROUND_FRAME_INTERVAL_MS);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        startIntervalFallback();
      } else {
        startRAF();
      }
    };

    const onWindowBlur = () => startIntervalFallback();
    const onWindowFocus = () => {
      if (!document.hidden) startRAF();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onWindowBlur);
    window.addEventListener("focus", onWindowFocus);

    const init = async (): Promise<void> => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          TASKS_VISION_WASM_CDN
        );

        if (!isRunning) return;

        imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: SELFIE_SEGMENTATION_MODEL_URL,
            // GPU delegate — uses WebGL for inference, significantly faster than CPU
            delegate: "GPU",
          },
          outputCategoryMask: true,
          outputConfidenceMasks: true,
          runningMode: "VIDEO",
        });

        if (!isRunning) {
          imageSegmenter.close();
          imageSegmenter = null;

          return;
        }

        // Cancel passthrough now that the segmenter is ready
        if (passthroughRafId !== null) {
          cancelAnimationFrame(passthroughRafId);
          passthroughRafId = null;
        }

        if (document.hidden) {
          startIntervalFallback();
        } else {
          startRAF();
        }
      } catch (err) {
        console.error(
          "[useConfigureVideo] Failed to initialize ImageSegmenter:",
          err
        );
      }
    };

    void init();

    return () => {
      isRunning = false;
      if (passthroughRafId !== null) cancelAnimationFrame(passthroughRafId);
      stopRAF();
      stopInterval();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("focus", onWindowFocus);
      imageSegmenter?.close();
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
