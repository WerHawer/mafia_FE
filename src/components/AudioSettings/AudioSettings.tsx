import { CustomerServiceOutlined, SoundOutlined, AudioMutedOutlined, AudioOutlined } from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { rootStore } from "@/store/rootStore.ts";
import { Typography } from "@/UI/Typography";
import classNames from "classnames";
import styles from "./AudioSettings.module.scss";

interface AudioSettingsProps {
    className?: string;
}

export const AudioSettings = observer(({ className }: AudioSettingsProps) => {
    const { t } = useTranslation();
    const { soundStore } = rootStore;

    return (
        <div className={classNames(styles.audioSettings, className)}>
            <div className={styles.section}>
                <div className={styles.header}>
                    <CustomerServiceOutlined className={styles.icon} />
                    <Typography variant="subtitle" className={styles.label}>
                        {t("audioSettings.musicVolume")}
                    </Typography>
                    <span className={styles.value}>{Math.round(soundStore.musicVolume * 100)}%</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={soundStore.musicVolume}
                    onChange={(e) => soundStore.setMusicVolume(parseFloat(e.target.value))}
                    className={styles.slider}
                    aria-label={t("audioSettings.musicVolume")}
                />
            </div>

            <div className={styles.section}>
                <div className={styles.header}>
                    <SoundOutlined className={styles.icon} />
                    <Typography variant="subtitle" className={styles.label}>
                        {t("audioSettings.sfxVolume")}
                    </Typography>
                    <span className={styles.value}>{Math.round(soundStore.sfxVolume * 100)}%</span>
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
                <button 
                    className={classNames(styles.muteButton, { [styles.muted]: soundStore.isMuted })}
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
                </button>
            </div>
        </div>
    );
});
