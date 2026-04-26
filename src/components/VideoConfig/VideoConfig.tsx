import Tippy from "@tippyjs/react";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import blurIcon from "@/assets/icons/blur.png";
import removeIcon from "@/assets/icons/remove.png";
import { BackgroundImageList } from "@/components/VideoConfig/BackgroundImageList.tsx";
import { useCustomVideo } from "@/hooks/useCustomVideo.ts";
import { useVideoSettings } from "@/hooks/useVideoSettings.ts";
import { rootStore } from "@/store/rootStore.ts";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";

import styles from "./VideoConfig.module.scss";

import { useAdaptiveQuality } from "@/hooks/useAdaptiveQuality.ts";
import { QUALITY_PRESETS, QualityTier } from "@/config/video.ts";

type VideoConfigProps = {
  originalStream: MediaStream | null;
  gameId: string;
  onClose?: () => void;
  isShown?: boolean;
  quality?: ReturnType<typeof useAdaptiveQuality>;
};

export const VideoConfig = observer(
  ({ originalStream, gameId, onClose, isShown, quality }: VideoConfigProps) => {
    const { t } = useTranslation();
    const { streamsStore, usersStore } = rootStore;
    const { setImageToBackgrounds } = streamsStore;
    const { saveSettings, getSavedSettings } = useVideoSettings(gameId);

    const {
      isStreamReady,
      setIsSaved,
      videoRef,
      imgRef,
      canvasRef,
      imageURL,
      setImageURL,
      setWithBlur,
      videoSettings,
      applySettings,
    } = useCustomVideo(originalStream, getSavedSettings(), quality?.settings);

    // Apply saved settings exactly once — when the stream first becomes available.
    // We use a ref flag so quality-change stream restarts don't re-apply stale
    // localStorage settings over the user's current in-memory selection.
    const settingsAppliedRef = useRef(false);

    useEffect(() => {
      if (!originalStream || settingsAppliedRef.current) return;

      settingsAppliedRef.current = true;

      const savedSettings = getSavedSettings();

      if (savedSettings) {
        applySettings(savedSettings);
      }
    }, [originalStream, getSavedSettings, applySettings]);

    const onDownloadImage = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check if file size > 1MB
        if (file.size > 1024 * 1024) {
          alert(t("videoConfig.fileTooLarge", "File is too large. Maximum size is 1MB."));
          e.target.value = "";
          return;
        }

        const reader = new FileReader();

        reader.onload = () => {
          if (reader.readyState === 2) {
            const myId = usersStore.myId;
            setImageURL(reader.result as string);
            if (myId) {
              setImageToBackgrounds(myId, reader.result as string);
            }
            setWithBlur(false);
          }
        };

        reader.readAsDataURL(file);
      },
      [setImageToBackgrounds, setImageURL, setWithBlur, usersStore.myId, t]
    );

    const handleSave = useCallback(() => {
      saveSettings(videoSettings);
      setIsSaved(true);
      onClose?.();
    }, [saveSettings, setIsSaved, videoSettings, onClose]);

    const handleImageClick = useCallback(
      (url: string) => {
        setImageURL(url);
        setWithBlur(false);
      },
      [setImageURL, setWithBlur]
    );

    return (
      <div className={classNames(styles.container, !isShown && styles.hide)}>
        <div className={styles.content}>
          <div className={styles.videoContainer}>
            <img
              className={classNames(styles.img, styles.displayNone)}
              src={imageURL || undefined}
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
                <Tippy
                  content={t("videoConfig.removeEffect")}
                  theme="nav-tooltip"
                  placement="top"
                  animation="shift-away"
                  delay={[300, 0]}
                >
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

                <Tippy
                  content={t("videoConfig.blurEffect")}
                  theme="nav-tooltip"
                  placement="top"
                  animation="shift-away"
                  delay={[300, 0]}
                >
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

                {/* Quality picker — compact icon with Tippy popover */}
                {quality && (
                  <Tippy
                    content={
                      <div className={styles.qualityPopover}>
                        {(Object.keys(QUALITY_PRESETS) as QualityTier[]).map((t_) => (
                          <button
                            key={t_}
                            className={classNames(
                              styles.qualityOption,
                              quality.tier === t_ && styles.qualityOptionActive
                            )}
                            onClick={() => quality.setTier(t_)}
                          >
                            {QUALITY_PRESETS[t_].label}
                            {t_ === quality.detectedTier && (
                              <span className={styles.autoTag}>авто</span>
                            )}
                          </button>
                        ))}
                        {quality.actualResolution && (
                          <p className={styles.qualityActual}>
                            📷 {quality.actualResolution.width}×{quality.actualResolution.height}
                          </p>
                        )}
                      </div>
                    }
                    theme="quality-picker"
                    trigger="click"
                    interactive
                    placement="bottom-start"
                    appendTo="parent"
                  >
                    <div
                      className={styles.qualityBadge}
                      title={t("videoConfig.qualityTitle", "Якість відео")}
                    >
                      {quality.settings.height}p
                    </div>
                  </Tippy>
                )}
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
                onClick={handleSave}
                variant={ButtonVariant.Primary}
                size={ButtonSize.MS}
                disabled={!isStreamReady}
              >
                {t("common.done")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

VideoConfig.displayName = "VideoConfig";
