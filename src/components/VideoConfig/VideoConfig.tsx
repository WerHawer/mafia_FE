import { useRoomContext } from "@livekit/components-react";
import Tippy from "@tippyjs/react";
import classNames from "classnames";
import { LocalVideoTrack, Track } from "livekit-client";
import { observer } from "mobx-react-lite";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import blurIcon from "@/assets/icons/blur.png";
import removeIcon from "@/assets/icons/remove.png";
import { BackgroundImageList } from "@/components/VideoConfig/BackgroundImageList.tsx";
import { useConfigureVideo } from "@/hooks/useConfigureVideo.ts";
import { rootStore } from "@/store/rootStore.ts";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";

import styles from "./VideoConfig.module.scss";

export const VideoConfig = observer(() => {
  const { t } = useTranslation();
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
  const room = useRoomContext();

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
    if (!isSaved || !canvasRef.current || !myOriginalStream || !room) return;

    // Wait for room to be fully connected
    if (room.state !== "connected") {
      console.log("VideoConfig: Room not yet connected, waiting...");
      return;
    }

    console.log("VideoConfig: Starting track replacement process");

    const canvas = canvasRef.current;
    const videoStream = canvas.captureStream(30); // 30 FPS

    // Get video track from canvas stream
    const [canvasVideoTrack] = videoStream.getVideoTracks();

    if (!canvasVideoTrack) {
      console.error("VideoConfig: No video track found in canvas stream");
      return;
    }

    console.log("VideoConfig: Canvas video track created:", canvasVideoTrack);

    // Create LocalVideoTrack for LiveKit (without source in constructor)
    const localVideoTrack = new LocalVideoTrack(canvasVideoTrack);

    console.log("VideoConfig: LocalVideoTrack created");

    // Unpublish existing video tracks from LiveKit
    const existingVideoTracks = Array.from(
      room.localParticipant.trackPublications.values()
    ).filter((pub) => pub.kind === Track.Kind.Video);

    console.log(
      "VideoConfig: Found existing video tracks:",
      existingVideoTracks.length
    );

    const unpublishPromises = existingVideoTracks.map(async (publication) => {
      if (publication.track) {
        console.log(
          "VideoConfig: Unpublishing existing video track:",
          publication.trackSid
        );
        await room.localParticipant.unpublishTrack(publication.track);
      }
    });

    // Wait for all unpublishing to complete, then publish new track
    Promise.all(unpublishPromises)
      .then(() => {
        console.log(
          "VideoConfig: All existing tracks unpublished, publishing new track"
        );
        // Publish with explicit source parameter
        return room.localParticipant.publishTrack(localVideoTrack, {
          source: Track.Source.Camera, // Set source when publishing
        });
      })
      .then(() => {
        console.log(
          "VideoConfig: Successfully published processed video track to LiveKit with Camera source"
        );

        // Also update the store for other components
        const combinedStream = new MediaStream();
        videoStream
          .getVideoTracks()
          .forEach((track) => combinedStream.addTrack(track));
        setMyStream(combinedStream);
      })
      .catch((error) => {
        console.error("VideoConfig: Failed to replace video track:", error);
      });
  }, [canvasRef, isSaved, myOriginalStream, room, setMyStream]);

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
    [setImageToBackgrounds, setImageURL, setWithBlur]
  );

  const handleSave = useCallback(() => {
    setIsSaved(true);
  }, []);

  const handleImageClick = useCallback(
    (url: string) => {
      setImageURL(url);
      setWithBlur(false);
    },
    [setImageURL, setWithBlur]
  );

  return (
    <div className={classNames(styles.container, isSaved && styles.hide)}>
      <div className={styles.content}>
        <div className={styles.videoContainer}>
          <img
            className={classNames(styles.img, styles.displayNone)}
            src={imageURL}
            alt={t("videoConfig.background")}
            ref={imgRef}
          />
          <video
            className={classNames(styles.video, styles.displayNone)}
            muted
            autoPlay
            ref={videoRef}
          />

          {!myOriginalStream && <p>{t("loading")}</p>}

          <canvas
            ref={canvasRef}
            className={classNames(
              styles.canvas,
              !myOriginalStream && styles.displayNone
            )}
          />
        </div>

        <div className={styles.controllers}>
          <div className={styles.effectsSection}>
            <h3 className={styles.sectionTitle}>
              {t("videoConfig.effectsTitle")}
            </h3>
            <div className={styles.baseEffectButton}>
              <Tippy content={t("videoConfig.removeEffect")}>
                <img
                  className={styles.icon}
                  src={removeIcon}
                  alt={t("videoConfig.removeEffect")}
                  onClick={() => {
                    setImageURL("");
                    setWithBlur(false);
                  }}
                  width="40"
                  height="40"
                />
              </Tippy>

              <Tippy content={t("videoConfig.blurEffect")}>
                <img
                  className={styles.icon}
                  src={blurIcon}
                  alt={t("videoConfig.blurEffect")}
                  onClick={() => {
                    setImageURL("");
                    setWithBlur(true);
                  }}
                  width="40"
                  height="40"
                />
              </Tippy>
            </div>
          </div>

          <div className={styles.effectsSection}>
            <h3 className={styles.sectionTitle}>
              {t("videoConfig.backgroundsTitle")}
            </h3>
            <BackgroundImageList onImageClick={handleImageClick} />
          </div>

          <label className={styles.labelDownload}>
            {t("videoConfig.download")}
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
              size={ButtonSize.MS}
            >
              {t("common.back")}
            </Button>

            <Button
              onClick={handleSave}
              variant={ButtonVariant.Primary}
              size={ButtonSize.MS}
            >
              {t("common.done")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
