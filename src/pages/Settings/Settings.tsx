import { useTranslation } from "react-i18next";

import { AvatarUpload } from "@/components/AvatarUpload/AvatarUpload.tsx";
import { AudioSettings } from "@/components/AudioSettings/AudioSettings.tsx";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Typography } from "@/UI/Typography";

import styles from "./Settings.module.scss";

const Settings = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <Typography variant="title" className={styles.title}>
        {t("settings.title")}
      </Typography>

      <div className={styles.section}>
        <Typography variant="subtitle" className={styles.sectionTitle}>
          {t("settings.profile")}
        </Typography>
        <AvatarUpload />
      </div>

      <div className={styles.section}>
        <Typography variant="subtitle" className={styles.sectionTitle}>
          {t("settings.language")}
        </Typography>
        <LanguageSwitcher />
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
