import { useTranslation } from "react-i18next";
import classNames from "classnames";
import styles from "./GameEntryLoader.module.scss";

export const GameEntryLoader = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.loaderContainer}>
      <div className={styles.loaderGroup}>
        {/* Animated outer ring / aim */}
        <div className={styles.aimWrapper}>
          <img src="/aim.svg" alt="Loading..." className={styles.aimIcon} />
        </div>

        {/* Pulsing inner dot representing a bullet/bullet hole */}
        <div className={styles.bulletDot} />
      </div>
      <p className={styles.loadingText}>{t("gameVideo.connecting", "Connecting to game...")}</p>
    </div>
  );
};
