import {
  AudioMutedOutlined,
  AudioOutlined,
  CustomerServiceOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  SoundOutlined,
} from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { rootStore } from "@/store/rootStore.ts";
import { SoundEffect } from "@/store/soundStore.ts";
import { Typography } from "@/UI/Typography";
import { Button } from "@/UI/Button/Button.tsx";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import classNames from "classnames";
import styles from "./AudioSettings.module.scss";

interface AudioSettingsProps {
  className?: string;
}

export const AudioSettings = observer(({ className }: AudioSettingsProps) => {
  const { t } = useTranslation();
  const { soundStore } = rootStore;

  const toggleMusicPreview = () => {
    if (soundStore.isPlayingMusic) {
      soundStore.stopMusic();
    } else {
      soundStore.playBgMusic(
        ["day_bg.mp3", "day_bg_1.mp3", "day_bg_2.mp3"],
        true
      );
    }
  };

  const playSfxPreview = () => {
    soundStore.playSfx(SoundEffect.Shot);
  };

  return (
    <div className={classNames(styles.audioSettings, className)}>
      <div className={styles.section}>
        <div className={styles.header}>
          <Button
            variant={ButtonVariant.Outline}
            size={ButtonSize.Small}
            className={styles.previewBtn}
            onClick={toggleMusicPreview}
            title={soundStore.isPlayingMusic ? t("stop") : t("play")}
          >
            {soundStore.isPlayingMusic ? (
              <PauseCircleOutlined />
            ) : (
              <PlayCircleOutlined />
            )}
          </Button>
          <CustomerServiceOutlined className={styles.icon} />
          <Typography variant="subtitle" className={styles.label}>
            {t("audioSettings.musicVolume")}
          </Typography>
          <span className={styles.value}>
            {Math.round(soundStore.musicVolume * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={soundStore.musicVolume}
          onChange={(e) =>
            soundStore.setMusicVolume(parseFloat(e.target.value))
          }
          className={styles.slider}
          aria-label={t("audioSettings.musicVolume")}
        />
      </div>

      <div className={styles.section}>
        <div className={styles.header}>
          <Button
            variant={ButtonVariant.Outline}
            size={ButtonSize.Small}
            className={styles.previewBtn}
            onClick={playSfxPreview}
            title={t("play")}
          >
            <PlayCircleOutlined />
          </Button>
          <SoundOutlined className={styles.icon} />
          <Typography variant="subtitle" className={styles.label}>
            {t("audioSettings.sfxVolume")}
          </Typography>
          <span className={styles.value}>
            {Math.round(soundStore.sfxVolume * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={soundStore.sfxVolume}
          onChange={(e) => soundStore.setSfxVolume(parseFloat(e.target.value))}
          className={styles.slider}
          aria-label={t("audioSettings.sfxVolume")}
        />
      </div>

      <div className={styles.footer}>
        <Button
          variant={
            soundStore.isMuted ? ButtonVariant.Error : ButtonVariant.Primary
          }
          size={ButtonSize.Medium}
          onClick={soundStore.toggleMute}
        >
          {soundStore.isMuted ? (
            <>
              <AudioMutedOutlined />
              <span>{t("audioSettings.unmuteAll")}</span>
            </>
          ) : (
            <>
              <AudioOutlined />
              <span>{t("audioSettings.muteAll")}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
});
