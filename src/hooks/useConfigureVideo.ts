import * as cam from "@mediapipe/camera_utils";
import { Results, SelfieSegmentation } from "@mediapipe/selfie_segmentation";
import { useCallback, useEffect, useRef, useState } from "react";

import { PRE_VIDEO_HEIGHT, PRE_VIDEO_WIDTH, videoOptions } from "@/config/video.ts";
import { UserVideoSettings } from "@/types/user.types.ts";

const HIGH_VIDEO_WIDTH = videoOptions.width;
const HIGH_VIDEO_HEIGHT = videoOptions.height;

const bgEffects = {
  blur: "blur",
  img: "img",
  none: "none",
} as const;

type BackgroundEffects = keyof typeof bgEffects;

export const useConfigureVideo = (
  videoSettings: UserVideoSettings,
  myOriginalStream?: MediaStream
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

  const onResults = useCallback(
    (results: Results) => {
      if (!videoRef.current || !canvasRef.current || !myOriginalStream) return;

      const img = imgRef.current;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const videoTrack = myOriginalStream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();

      video.srcObject = myOriginalStream;

      const videoWidth = settings.width ?? HIGH_VIDEO_WIDTH;
      const videoHeight = settings.height ?? HIGH_VIDEO_HEIGHT;

      canvas.width = videoWidth;
      canvas.height = videoHeight;

      const ctx = canvas.getContext("2d", {
        desynchronized: true,
        alpha: true,
      });

      if (!ctx) return;

      ctx.save();
      ctx.clearRect(0, 0, videoWidth, videoHeight);
      ctx.scale(-1, 1);

      ctx.filter = "blur(2px)";
      ctx.drawImage(
        results.segmentationMask,
        -videoWidth,
        0,
        videoWidth,
        videoHeight
      );

      ctx.globalCompositeOperation = "source-in";
      ctx.filter = "none";
      ctx.drawImage(results.image, -videoWidth, 0, videoWidth, videoHeight);

      if (bgEffectsRef.current === bgEffects.blur) {
        ctx.globalCompositeOperation = "destination-over";
        ctx.filter = "blur(20px) brightness(0.97) saturate(1.1)";
        ctx.drawImage(results.image, -videoWidth, 0, videoWidth, videoHeight);

        ctx.globalCompositeOperation = "source-over";
        ctx.filter = "none";
        const gradient = ctx.createRadialGradient(
          -videoWidth / 2, videoHeight / 2, videoHeight * 0.3,
          -videoWidth / 2, videoHeight / 2, videoHeight * 0.8
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

        ctx.filter = "blur(2px)";
        ctx.drawImage(
          results.segmentationMask,
          -videoWidth,
          0,
          videoWidth,
          videoHeight
        );

        ctx.globalCompositeOperation = "source-in";
        ctx.filter = "none";
        ctx.drawImage(results.image, -videoWidth, 0, videoWidth, videoHeight);

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
        ctx.drawImage(results.image, -videoWidth, 0, videoWidth, videoHeight);

        ctx.globalCompositeOperation = "source-over";
        ctx.filter = "contrast(1.05) brightness(1.02)";
        ctx.globalAlpha = 0.2;
        ctx.drawImage(results.image, -videoWidth, 0, videoWidth, videoHeight);
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

    if (videoRef.current) {
      const camera = new cam.Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) {
            await selfieSegmentation.send({ image: videoRef.current });
          }
        },
        width: settings.width ?? HIGH_VIDEO_WIDTH,
        height: settings.height ?? HIGH_VIDEO_HEIGHT,
      });

      setTimeout(() => {
        camera.start();
      }, 100);

      return () => {
        camera.stop();
        selfieSegmentation.close();
      };
    }
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
