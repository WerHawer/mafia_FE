import {
  AudioMutedOutlined,
  AudioOutlined,
  VideoCameraAddOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import classNames from "classnames";
import { memo } from "react";

import { SoundIndicator } from "@/components/SoundIndicator";

import styles from "./MediaControls.module.scss";

type MediaControlsProps = {
  isCameraEnabled: boolean;
  isMicrophoneEnabled: boolean;
  onToggleCamera: () => void;
  onToggleMicrophone: () => void;
  canControl: boolean;
  isMyAfterStart: boolean;
  isIGM?: boolean;
  isMyStream?: boolean;
  isSpeaking?: boolean;
  isUserGM?: boolean;
};

export const MediaControls = memo(
  ({
    isCameraEnabled,
    isMicrophoneEnabled,
    onToggleCamera,
    onToggleMicrophone,
    canControl,
    isMyAfterStart,
    isIGM = false,
    isMyStream = false,
    isSpeaking = false,
  }: MediaControlsProps) => {
    const handleCameraClick = () => {
      if (canControl) {
        onToggleCamera();
      }
    };

    const handleMicrophoneClick = () => {
      if (canControl) {
        onToggleMicrophone();
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent, callback: () => void) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        callback();
      }
    };
    // Показуємо індикатор звуку замість мікрофона якщо:
    // - є відео (камера ввімкнена)
    // - людина говорить
    // - це не мій стрім (користувач не бачить свій індикатор)
    // - мікрофон ввімкнений
    const showSoundIndicator =
      isCameraEnabled && isSpeaking && !isMyStream && !isIGM;

    // Логіка відображення контролів:
    // 1. GM бачить всі контроли для всіх
    // 2. Власні контроли бачать всі
    // 3. Інші гравці бачать тільки вимкнений мікрофон інших гравців
    const shouldShowMicrophone =
      isIGM || isMyStream || !isMicrophoneEnabled || showSoundIndicator;
    const shouldShowCamera = isIGM || isMyStream;

    return (
      <div
        className={classNames(styles.mediaControls, {
          [styles.small]: isMyAfterStart,
        })}
      >
        {shouldShowMicrophone ? (
          <div
            className={classNames(styles.controlButton, {
              [styles.disabled]: !isMicrophoneEnabled,
              [styles.interactive]: canControl,
            })}
            onClick={handleMicrophoneClick}
            onKeyDown={(e) => handleKeyDown(e, handleMicrophoneClick)}
            tabIndex={canControl ? 0 : undefined}
            role={canControl ? "button" : undefined}
            aria-label={
              isMicrophoneEnabled ? "Вимкнути мікрофон" : "Увімкнути мікрофон"
            }
          >
            {showSoundIndicator ? (
              <SoundIndicator />
            ) : isMicrophoneEnabled ? (
              <AudioOutlined className={styles.icon} />
            ) : (
              <AudioMutedOutlined className={styles.icon} />
            )}
          </div>
        ) : null}

        {shouldShowCamera && (
          <div
            className={classNames(styles.controlButton, {
              [styles.disabled]: !isCameraEnabled,
              [styles.interactive]: canControl,
            })}
            onClick={handleCameraClick}
            onKeyDown={(e) => handleKeyDown(e, handleCameraClick)}
            tabIndex={canControl ? 0 : undefined}
            role={canControl ? "button" : undefined}
            aria-label={
              isCameraEnabled ? "Вимкнути камеру" : "Увімкнути камеру"
            }
          >
            {isCameraEnabled ? (
              <VideoCameraOutlined className={styles.icon} />
            ) : (
              <VideoCameraAddOutlined className={styles.icon} />
            )}
          </div>
        )}
      </div>
    );
  }
);

MediaControls.displayName = "MediaControls";
