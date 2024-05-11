import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { useUserMediaStream } from "@/hooks/useUserMediaStream.ts";
import { rootStore } from "@/store/rootStore.ts";
import styles from "./VideoConfigModal.module.scss";
import defaultImg from "@/assets/images/starWars.jpg";
import { Results, SelfieSegmentation } from "@mediapipe/selfie_segmentation";
import * as cam from "@mediapipe/camera_utils";
import classNames from "classnames";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";

const PRE_VIDEO_WIDTH = 800;
const PRE_VIDEO_HEIGHT = 600;

export const VideoConfigModal = observer(() => {
  const [imageURL, setImageURL] = useState(defaultImg);
  const [withBlur, setWithBlur] = useState(false);
  const { streamsStore } = rootStore;
  const { myOriginalStream, setMyStream } = streamsStore;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const bgEffectsRef = useRef<"blur" | "img" | "none">("none");

  const withoutEffects = !imageURL && !withBlur;

  useUserMediaStream({
    audio: true,
    video: true,
  });

  useEffect(() => {
    bgEffectsRef.current = withBlur ? "blur" : "img";

    if (withoutEffects) {
      bgEffectsRef.current = "none";
    }
  }, [withBlur, imageURL, withoutEffects]);

  const onResults = useCallback(
    (results: Results) => {
      if (
        !videoRef.current ||
        !canvasRef.current ||
        !imgRef.current ||
        !myOriginalStream
      )
        return;

      const img = imgRef.current;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      video.srcObject = myOriginalStream;
      canvas.width = PRE_VIDEO_WIDTH;
      canvas.height = PRE_VIDEO_HEIGHT;

      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.filter = "blur(2px)";
      ctx.drawImage(
        results.segmentationMask,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      ctx.globalCompositeOperation = "source-in";
      ctx.filter = "none";

      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      if (bgEffectsRef.current === "blur") {
        ctx.globalCompositeOperation = "destination-over";
        ctx.filter = "blur(10px)";
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        return;
      }

      if (bgEffectsRef.current === "img") {
        ctx.globalCompositeOperation = "destination-over";
        ctx.filter = "none";
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        return;
      }

      if (bgEffectsRef.current === "none") {
        ctx.globalCompositeOperation = "destination-over";
        ctx.filter = "blur(0px)";
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        return;
      }
    },
    [myOriginalStream],
  );

  useEffect(() => {
    if (withoutEffects) return;

    const selfieSegmentation = new SelfieSegmentation({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
      },
    });

    selfieSegmentation.setOptions({
      modelSelection: 1,
    });

    selfieSegmentation.onResults(onResults);

    if (videoRef.current) {
      const camera = new cam.Camera(videoRef.current, {
        onFrame: async () => {
          await selfieSegmentation.send({ image: videoRef.current! });
        },
        width: PRE_VIDEO_WIDTH,
        height: PRE_VIDEO_HEIGHT,
      });

      camera.start();
    }
  }, [onResults, withBlur, withoutEffects]);

  const imageHandler = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.readyState === 2) {
        setImageURL(reader.result as string);
      }
    };

    reader.readAsDataURL(e.target.files![0]);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.controllers}>
        <input
          type="file"
          accept="image/*"
          onChange={imageHandler}
          className={styles.input}
        />

        <Button
          onClick={() => {
            if (!withBlur) {
              setImageURL("");
            } else {
              setImageURL(defaultImg);
            }

            setWithBlur(!withBlur);
          }}
          size={ButtonSize.Small}
        >
          {withBlur ? "Remove blur" : "Add blur"}
        </Button>
        <Button
          onClick={() => {
            setImageURL("");
            setWithBlur(false);
          }}
          size={ButtonSize.Small}
          variant={ButtonVariant.Secondary}
        >
          RemoveEffects
        </Button>
      </div>
      <img
        className={classNames(styles.img, styles.displayNone)}
        src={imageURL}
        alt="background"
        ref={imgRef}
      />
      <video
        className={classNames(styles.video, styles.displayNone)}
        muted
        autoPlay
        ref={videoRef}
      />

      <canvas ref={canvasRef} className={classNames(styles.canvas)} />
    </div>
  );
});
