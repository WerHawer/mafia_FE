import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { AudioSettings } from "@/components/AudioSettings/AudioSettings.tsx";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import styles from "./AudioConfig.module.scss";

type AudioConfigProps = {
  onClose?: () => void;
  isShown?: boolean;
};

export const AudioConfig = observer(({ onClose, isShown }: AudioConfigProps) => {
  const { t } = useTranslation();

  return (
    <div className={classNames(styles.container, !isShown && styles.hide)}>
      <div className={styles.content}>
        <div className={styles.header}>
            <h2 className={styles.title}>{t("audioSettings.title")}</h2>
        </div>
        
        <div className={styles.settingsWrapper}>
            <AudioSettings />
        </div>

        <div className={styles.buttonContainer}>
          <Button
            onClick={onClose}
            variant={ButtonVariant.Primary}
            size={ButtonSize.MS}
          >
            {t("common.done")}
          </Button>
        </div>
      </div>
    </div>
  );
});

AudioConfig.displayName = "AudioConfig";
