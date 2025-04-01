import * as cam from "@mediapipe/camera_utils";
import { Results, SelfieSegmentation } from "@mediapipe/selfie_segmentation";
import { useCallback, useEffect, useRef, useState } from "react";

import { PRE_VIDEO_HEIGHT, PRE_VIDEO_WIDTH } from "@/config/video.ts";
import { UserVideoSettings } from "@/types/user.types.ts";

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

      const videoWidth = settings.width ?? PRE_VIDEO_WIDTH;
      const videoHeight = settings.height ?? PRE_VIDEO_HEIGHT;

      canvas.width = videoWidth;
      canvas.height = videoHeight;

      const ctx = canvas.getContext("2d", {
        desynchronized: true,
      });

      if (!ctx) return;

      ctx.save();
      ctx.clearRect(0, 0, videoWidth, videoHeight);
      ctx.scale(-1, 1);

      ctx.filter = "blur(1px)";
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
        ctx.filter = "blur(15px) brightness(0.95)";
        ctx.drawImage(results.image, -videoWidth, 0, videoWidth, videoHeight);
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

        ctx.globalCompositeOperation = "destination-over";
        ctx.filter = "none";
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        ctx.restore();

        return;
      }

      if (bgEffectsRef.current === bgEffects.none) {
        ctx.globalCompositeOperation = "destination-over";
        ctx.filter = "none";
        ctx.drawImage(results.image, -videoWidth, 0, videoWidth, videoHeight);
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
        width: settings.width ?? PRE_VIDEO_WIDTH,
        height: settings.height ?? PRE_VIDEO_HEIGHT,
      });

      camera.start();

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
