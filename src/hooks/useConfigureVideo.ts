import { Results, SelfieSegmentation } from "@mediapipe/selfie_segmentation";
import { useCallback, useEffect, useRef, useState } from "react";

import { videoOptions } from "@/config/video.ts";
import { UserVideoSettings } from "@/types/user.types.ts";

const HIGH_VIDEO_WIDTH = videoOptions.width;
const HIGH_VIDEO_HEIGHT = videoOptions.height;

/**
 * Interval used as fallback when RAF is throttled (hidden tab / blurred window).
 * Browsers allow setInterval to run even in background (throttled to ~1fps minimum),
 * ensuring the canvas stream does not completely freeze for remote participants.
 */
const BACKGROUND_FRAME_INTERVAL_MS = 1000 / 30; // ~33ms @ 30fps

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

  const withoutEffects = !imageURL && !withBlur;

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

  // Додаємо refs для кешування попередніх розмірів
  const prevWidthRef = useRef<number>(0);
  const prevHeightRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  const onResults = useCallback(
    (results: Results) => {
      if (!videoRef.current || !canvasRef.current || !myOriginalStream) return;

      // Обмежуємо частоту кадрів для зменшення навантаження
      const now = performance.now();
      if (now - lastFrameTimeRef.current < 33) {
        // приблизно 30 fps
        return;
      }
      lastFrameTimeRef.current = now;

      const img = imgRef.current;
      const canvas = canvasRef.current;
      const videoTrack = myOriginalStream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();

      const videoWidth = settings.width ?? HIGH_VIDEO_WIDTH;
      const videoHeight = settings.height ?? HIGH_VIDEO_HEIGHT;

      // Змінюємо розміри canvas тільки якщо вони змінилися
      if (
        prevWidthRef.current !== videoWidth ||
        prevHeightRef.current !== videoHeight
      ) {
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        prevWidthRef.current = videoWidth;
        prevHeightRef.current = videoHeight;
      }

      const ctx = canvas.getContext("2d", {
        desynchronized: true,
        alpha: true,
        willReadFrequently: false, // Підказка для оптимізації
      });

      if (!ctx) return;

      ctx.save();
      ctx.clearRect(0, 0, videoWidth, videoHeight);
      ctx.scale(1, 1);

      ctx.filter = "blur(2.5px)";
      ctx.drawImage(results.segmentationMask, 0, 0, videoWidth, videoHeight);

      ctx.globalCompositeOperation = "source-in";
      ctx.filter = "none";
      ctx.drawImage(results.image, 0, 0, videoWidth, videoHeight);

      if (bgEffectsRef.current === bgEffects.blur) {
        ctx.globalCompositeOperation = "destination-over";
        ctx.filter = "blur(20px) brightness(0.97) saturate(1.1)";
        ctx.drawImage(results.image, 0, 0, videoWidth, videoHeight);

        ctx.globalCompositeOperation = "source-over";
        ctx.filter = "none";
        const gradient = ctx.createRadialGradient(
          -videoWidth / 2,
          videoHeight / 2,
          videoHeight * 0.3,
          -videoWidth / 2,
          videoHeight / 2,
          videoHeight * 0.8
        );
        gradient.addColorStop(0, "rgba(0,0,0,0)");
        gradient.addColorStop(1, "rgba(0,0,0,0.3)");
        ctx.fillStyle = gradient;
        ctx.fillRect(-videoWidth, 0, videoWidth, videoHeight);

        ctx.restore();
        return;
      }

      if (bgEffectsRef.current === bgEffects.img && img) {
        const imgWidth = img.width;
        const imgHeight = img.height;

        const canvasRatio = videoWidth / videoHeight;
        const imgRatio = imgWidth / imgHeight;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgRatio < canvasRatio) {
          drawWidth = videoWidth;
          drawHeight = drawWidth / imgRatio;
          offsetX = 0;
          offsetY = (videoHeight - drawHeight) / 2;
        } else {
          drawHeight = videoHeight;
          drawWidth = drawHeight * imgRatio;
          offsetX = (videoWidth - drawWidth) / 2;
          offsetY = 0;
        }

        ctx.filter = "blur(2.5px)";
        ctx.drawImage(results.segmentationMask, 0, 0, videoWidth, videoHeight);

        ctx.globalCompositeOperation = "source-in";
        ctx.filter = "none";
        ctx.drawImage(results.image, 0, 0, videoWidth, videoHeight);

        ctx.globalCompositeOperation = "destination-over";
        ctx.filter = "none";
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        ctx.globalCompositeOperation = "source-over";
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.restore();
        return;
      }

      if (bgEffectsRef.current === bgEffects.none) {
        ctx.globalCompositeOperation = "destination-over";
        ctx.filter = "none";
        ctx.drawImage(results.image, 0, 0, videoWidth, videoHeight);

        ctx.globalCompositeOperation = "source-over";
        ctx.filter = "contrast(1.05) brightness(1.02)";
        ctx.globalAlpha = 0.2;
        ctx.drawImage(results.image, 0, 0, videoWidth, videoHeight);
        ctx.globalAlpha = 1.0;

        ctx.restore();
        return;
      }
    },
    [myOriginalStream]
  );

  useEffect(() => {
    if (!myOriginalStream) return;

    const videoTrack = myOriginalStream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    const width = settings.width ?? HIGH_VIDEO_WIDTH;
    const height = settings.height ?? HIGH_VIDEO_HEIGHT;

    const selfieSegmentation = new SelfieSegmentation({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
      },
    });

    selfieSegmentation.setOptions({
      modelSelection: 1,
      selfieMode: true,
    });

    selfieSegmentation.onResults(onResults);

    const video = videoRef.current;

    if (!video) return;

    // Point the video element directly at the original stream so segmentation
    // always processes the user's own camera feed.
    video.srcObject = myOriginalStream;
    video.width = width;
    video.height = height;
    video.muted = true;
    video.playsInline = true;

    let isRunning = true;
    let isProcessingFrame = false;
    let rafId: number | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    /**
     * Send a single frame to MediaPipe for segmentation.
     * The isProcessingFrame guard prevents frame queue buildup when
     * segmentation takes longer than one RAF tick.
     */
    const processFrame = async (): Promise<void> => {
      if (
        !isRunning ||
        isProcessingFrame ||
        !video ||
        video.paused ||
        video.ended ||
        video.readyState < 2
      ) {
        return;
      }

      isProcessingFrame = true;

      try {
        await selfieSegmentation.send({ image: video });
      } catch {
        // Silently ignore transient frame-processing errors
      } finally {
        isProcessingFrame = false;
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
     * Primary loop — uses requestAnimationFrame when the tab is visible.
     * Provides smooth 30fps rendering aligned with the display refresh cycle.
     */
    const startRAF = () => {
      stopInterval();

      if (rafId !== null) return;

      const loop = () => {
        if (!isRunning) return;

        void processFrame();
        rafId = requestAnimationFrame(loop);
      };

      rafId = requestAnimationFrame(loop);
    };

    /**
     * Fallback loop — uses setInterval when the page is hidden or blurred.
     * Browsers throttle RAF to 0fps in hidden tabs but still allow setInterval
     * (albeit throttled to ~1fps), keeping the canvas stream alive for remote participants.
     */
    const startIntervalFallback = () => {
      stopRAF();

      if (intervalId !== null) return;

      intervalId = setInterval(() => {
        void processFrame();
      }, BACKGROUND_FRAME_INTERVAL_MS);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        startIntervalFallback();
      } else {
        startRAF();
      }
    };

    // window blur fires when another OS window covers or steals focus from the browser
    const onWindowBlur = () => startIntervalFallback();
    const onWindowFocus = () => {
      if (!document.hidden) {
        startRAF();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onWindowBlur);
    window.addEventListener("focus", onWindowFocus);

    // Brief delay mirrors the original camera.start() timeout, allowing the
    // video element time to attach the stream before the first send().
    const startTimeout = setTimeout(() => {
      void video.play().catch((err) => {
        console.error("[useConfigureVideo] Failed to play video:", err);
      });

      if (document.hidden) {
        startIntervalFallback();
      } else {
        startRAF();
      }
    }, 100);

    return () => {
      isRunning = false;
      clearTimeout(startTimeout);
      stopRAF();
      stopInterval();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("focus", onWindowFocus);
      selfieSegmentation.close();
    };
  }, [myOriginalStream, onResults, withBlur, withoutEffects]);

  return {
    setImageURL,
    withBlur,
    withoutEffects,
    imageURL,
    setWithBlur,
    videoRef,
    canvasRef,
    imgRef,
  };
};
