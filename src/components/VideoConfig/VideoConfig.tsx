import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import classNames from "classnames";
import { useNavigate } from "react-router-dom";
import styles from "./VideoConfig.module.scss";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import { rootStore } from "@/store/rootStore.ts";
import { useConfigureVideo } from "@/components/VideoConfig/useConfigureVideo.ts";
import blurIcon from "@/assets/icons/blur.png";
import removeIcon from "@/assets/icons/remove.png";
import { BackgroundImageList } from "@/components/VideoConfig/BackgroundImageList.tsx";
import Tippy from "@tippyjs/react";

export const VideoConfig = observer(() => {
  const navigate = useNavigate();
  const { streamsStore } = rootStore;
  const {
    myOriginalStream,
    setMyStream,
    videoSettings,
    setVideoSettings,
    setImageToBackgrounds,
  } = streamsStore;
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const {
    setImageURL,
    setWithBlur,
    imageURL,
    withBlur,
    videoRef,
    imgRef,
    canvasRef,
  } = useConfigureVideo(videoSettings, myOriginalStream);

  useEffect(() => {
    setVideoSettings({ withBlur, imageURL });
  }, [setVideoSettings, withBlur, imageURL]);

  useEffect(() => {
    if (!isSaved || !canvasRef.current || !myOriginalStream) return;

    const canvas = canvasRef.current;
    const videoStream = canvas.captureStream();

    const combinedStream = new MediaStream();
    videoStream
      .getVideoTracks()
      .forEach((track) => combinedStream.addTrack(track));
    myOriginalStream
      .getAudioTracks()
      .forEach((track) => combinedStream.addTrack(track));

    setMyStream(combinedStream);
  }, [canvasRef, isSaved, myOriginalStream, setMyStream]);

  const onDownloadImage = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (reader.readyState === 2) {
          setImageURL(reader.result as string);
          setImageToBackgrounds(reader.result as string);
          setWithBlur(false);
        }
      };

      reader.readAsDataURL(e.target.files![0]);
    },
    [setImageToBackgrounds, setImageURL, setWithBlur],
  );

  const handleSave = useCallback(() => {
    setIsSaved(true);
  }, []);

  const handleImageClick = useCallback(
    (url: string) => {
      setImageURL(url);
      setWithBlur(false);
    },
    [setImageURL, setWithBlur],
  );

  return (
    <div className={classNames(styles.container, isSaved && styles.hide)}>
      <div className={styles.content}>
        <div className={styles.videoContainer}>
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

          {!myOriginalStream && <p>Loading...</p>}

          <canvas
            ref={canvasRef}
            className={classNames(
              styles.canvas,
              !myOriginalStream && styles.displayNone,
            )}
          />
        </div>

        <div className={styles.controllers}>
          <div className={styles.baseEffectButton}>
            <Tippy content="Remove effect">
              <img
                className={styles.icon}
                src={removeIcon}
                alt="remove effect"
                onClick={() => {
                  setImageURL("");
                  setWithBlur(false);
                }}
                width="40"
                height="40"
              />
            </Tippy>

            <Tippy content="Blur effect">
              <img
                className={styles.icon}
                src={blurIcon}
                alt="blur"
                onClick={() => {
                  setImageURL("");
                  setWithBlur(true);
                }}
                width="40"
                height="40"
              />
            </Tippy>
          </div>

          <BackgroundImageList onImageClick={handleImageClick} />

          <label className={styles.labelDownload}>
            Download
            <input
              type="file"
              accept="image/*"
              onChange={onDownloadImage}
              className={styles.inputDownload}
            />
          </label>

          <div className={styles.buttonContainer}>
            <Button
              onClick={() => navigate(-1)}
              variant={ButtonVariant.Tertiary}
              size={ButtonSize.Medium}
              width="max-content"
            >
              Go back
            </Button>

            <Button
              onClick={handleSave}
              variant={ButtonVariant.Success}
              size={ButtonSize.Medium}
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
