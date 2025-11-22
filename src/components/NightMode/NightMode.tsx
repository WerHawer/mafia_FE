import { MoonOutlined } from "@ant-design/icons";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import styles from "./NightMode.module.scss";

type NightModeProps = {
  isVisible?: boolean;
};

export const NightMode = observer(({ isVisible = true }: NightModeProps) => {
  const { t } = useTranslation();
  const [isHiding, setIsHiding] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setIsHiding(true);
    } else {
      setIsHiding(false);
    }
  }, [isVisible]);

  return (
    <div
      className={classNames(styles.nightOverlay, {
        [styles.hiding]: isHiding,
      })}
    >
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
