import { VideoCameraOutlined, WarningOutlined } from "@ant-design/icons";
import Tippy from "@tippyjs/react";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import blurIcon from "@/assets/icons/blur.webp";
import removeIcon from "@/assets/icons/remove.webp";
import { BackgroundImageList } from "@/components/VideoConfig/BackgroundImageList.tsx";
import { useCustomVideo } from "@/hooks/useCustomVideo.ts";
import { useDeviceList } from "@/hooks/useDeviceList.ts";
import { MediaStreamError } from "@/hooks/useUserMediaStream.ts";
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
  streamError?: MediaStreamError | null;
  videoDeviceId?: string;
  onSelectVideoDevice?: (id: string) => void;
};

export const VideoConfig = observer(
  ({ originalStream, gameId, onClose, isShown, quality, streamError, videoDeviceId, onSelectVideoDevice }: VideoConfigProps) => {
    const { t } = useTranslation();
    const { streamsStore, usersStore } = rootStore;
    const { setImageToBackgrounds } = streamsStore;
    const { saveSettings, getSavedSettings, hasSavedSettings } = useVideoSettings(gameId);

    // True if the user has never configured this game's video before —
    // in that case we require them to finish setup (unless there's a stream error).
    const [isRequired] = useState(() => !hasSavedSettings());

    const { devices: videoDevices, refresh: refreshVideoDevices } = useDeviceList("videoinput");

    // After stream is acquired the browser exposes full device labels —
    // re-enumerate so the camera picker shows real names immediately.
    useEffect(() => {
      if (originalStream) void refreshVideoDevices();
    }, [originalStream, refreshVideoDevices]);

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

    const handleDone = useCallback(() => {
      if (isStreamReady) {
        saveSettings(videoSettings);
        setIsSaved(true);
      }
      onClose?.();
    }, [isStreamReady, saveSettings, setIsSaved, videoSettings, onClose]);

    const isDoneDisabled = isRequired && !isStreamReady && !streamError;

    const handleImageClick = useCallback(
      (url: string) => {
        setImageURL(url);
        setWithBlur(false);
      },
      [setImageURL, setWithBlur]
    );

    const renderVideoArea = () => {
      if (streamError) {
        return (
          <div className={styles.streamStatus}>
            <WarningOutlined className={styles.errorIcon} />
            <p className={styles.statusText}>{t(`videoConfig.error.${streamError.type}`)}</p>
          </div>
        );
      }

      if (!isStreamReady) {
        return (
          <div className={styles.streamStatus}>
            <div className={styles.spinner} />
            <p className={styles.statusText}>{t("videoConfig.streamLoading")}</p>
            <p className={styles.statusHint}>{t("videoConfig.streamLoadingHint")}</p>
          </div>
        );
      }

      return null;
    };

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

            {renderVideoArea()}

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
                              <span className={styles.autoTag}>
                                {t("videoConfig.auto")}
                              </span>
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
                    <Tippy
                      content={t("videoConfig.qualityTitle")}
                      theme="nav-tooltip"
                      placement="top"
                      animation="shift-away"
                      delay={[300, 0]}
                    >
                      <div className={styles.qualityBadge}>
                        {quality.settings.height}p
                      </div>
                    </Tippy>
                  </Tippy>
                )}

                {/* Camera source picker — shown only when 2+ video devices are available */}
                {videoDevices.length > 1 && onSelectVideoDevice && (
                  <Tippy
                    content={
                      <div className={styles.qualityPopover}>
                        {videoDevices.map((d, i) => (
                          <button
                            key={d.deviceId}
                            className={classNames(
                              styles.qualityOption,
                              videoDeviceId === d.deviceId && styles.qualityOptionActive
                            )}
                            onClick={() => onSelectVideoDevice(d.deviceId)}
                          >
                            {d.label || `${t("videoConfig.cameraSource")} ${i + 1}`}
                          </button>
                        ))}
                      </div>
                    }
                    theme="quality-picker"
                    trigger="click"
                    interactive
                    placement="bottom-start"
                    appendTo="parent"
                  >
                    <Tippy
                      content={t("videoConfig.cameraSourceTitle")}
                      theme="nav-tooltip"
                      placement="top"
                      animation="shift-away"
                      delay={[300, 0]}
                    >
                      <div className={styles.qualityBadge}>
                        <VideoCameraOutlined />
                      </div>
                    </Tippy>
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
                onClick={handleDone}
                variant={ButtonVariant.Primary}
                size={ButtonSize.MS}
                disabled={isDoneDisabled}
              >
                {streamError ? t("common.close") : t("common.done")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

VideoConfig.displayName = "VideoConfig";
