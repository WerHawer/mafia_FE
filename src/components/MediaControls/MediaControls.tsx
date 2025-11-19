import {
  AudioMutedOutlined,
  AudioOutlined,
  VideoCameraAddOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import classNames from "classnames";
import { KeyboardEvent, memo } from "react";

import styles from "./MediaControls.module.scss";

type MediaControlsProps = {
  isCameraEnabled: boolean;
  isMicrophoneEnabled: boolean;
  onToggleCamera: () => void;
  onToggleMicrophone: () => void;
  canControl: boolean;
};

export const MediaControls = memo(
  ({
    isCameraEnabled,
    isMicrophoneEnabled,
    onToggleCamera,
    onToggleMicrophone,
    canControl,
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

    const handleKeyDown = (e: KeyboardEvent, callback: () => void) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        callback();
      }
    };

    return (
      <div className={styles.mediaControls}>
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
          {isMicrophoneEnabled ? (
            <AudioOutlined className={styles.icon} />
          ) : (
            <AudioMutedOutlined className={styles.icon} />
          )}
        </div>

        <div
          className={classNames(styles.controlButton, {
            [styles.disabled]: !isCameraEnabled,
            [styles.interactive]: canControl,
          })}
          onClick={handleCameraClick}
          onKeyDown={(e) => handleKeyDown(e, handleCameraClick)}
          tabIndex={canControl ? 0 : undefined}
          role={canControl ? "button" : undefined}
          aria-label={isCameraEnabled ? "Вимкнути камеру" : "Увімкнути камеру"}
        >
          {isCameraEnabled ? (
            <VideoCameraOutlined className={styles.icon} />
          ) : (
            <VideoCameraAddOutlined className={styles.icon} />
          )}
        </div>
      </div>
    );
  }
);

MediaControls.displayName = "MediaControls";
