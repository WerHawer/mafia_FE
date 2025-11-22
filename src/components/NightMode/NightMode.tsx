import { MoonOutlined } from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import styles from "./NightMode.module.scss";

export const NightMode = observer(() => {
  const { t } = useTranslation();

  return (
    <div className={styles.nightOverlay}>
      <MoonOutlined className={styles.nightIcon} />

      <h2 className={styles.nightTitle}>{t("game.nightMode.title")}</h2>

      <p className={styles.nightSubtitle}>
        {t("game.nightMode.playerSubtitle")}
      </p>

      <div className={styles.nightInfo}>
        <p className={styles.nightInfoText}>🌙 {t("game.nightMode.info1")}</p>
        <p className={styles.nightInfoText}>🔇 {t("game.nightMode.info2")}</p>
        <p className={styles.nightInfoText}>⏳ {t("game.nightMode.info3")}</p>
      </div>
    </div>
  );
});

NightMode.displayName = "NightMode";
