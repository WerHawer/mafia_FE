import { useTranslation } from "react-i18next";

import { AudioSettings } from "@/components/AudioSettings/AudioSettings.tsx";
import { AvatarUpload } from "@/components/AvatarUpload/AvatarUpload.tsx";
import { Typography } from "@/UI/Typography";

import styles from "./Settings.module.scss";

const Settings = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <Typography variant="subtitle" className={styles.sectionTitle}>
          {t("settings.profile")}
        </Typography>
        <AvatarUpload />
      </div>

      <div className={styles.section}>
        <Typography variant="subtitle" className={styles.sectionTitle}>
          {t("settings.audio")}
        </Typography>
        <div className={styles.audioWrapper}>
          <AudioSettings />
        </div>
      </div>
    </div>
  );
};

export default Settings;
