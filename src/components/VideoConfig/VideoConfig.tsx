import Tippy from "@tippyjs/react";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { ChangeEvent, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import blurIcon from "@/assets/icons/blur.png";
import removeIcon from "@/assets/icons/remove.png";
import { BackgroundImageList } from "@/components/VideoConfig/BackgroundImageList.tsx";
import { useCustomVideo } from "@/hooks/useCustomVideo.ts";
import { rootStore } from "@/store/rootStore.ts";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";

import styles from "./VideoConfig.module.scss";

export const VideoConfig = observer(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { streamsStore } = rootStore;
  const { setImageToBackgrounds } = streamsStore;

  const {
    isStreamReady,
    isSaved,
    setIsSaved,
    videoRef,
    imgRef,
    canvasRef,
    imageURL,
    setImageURL,
    setWithBlur,
  } = useCustomVideo();

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
  }, [setIsSaved]);

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

          {!isStreamReady && <p>{t("loading")}...</p>}

          <canvas
            ref={canvasRef}
            className={classNames(
              styles.canvas,
              !isStreamReady && styles.displayNone
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
