import { useTranslation } from "react-i18next";

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
          {t("settings.language")}
        </Typography>
        <LanguageSwitcher />
      </div>
    </div>
  );
};

export default Settings;
