import { MoonOutlined } from "@ant-design/icons";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { wsEvents } from "@/config/wsEvents.ts";
import { useSocket } from "@/hooks/useSocket.ts";
import { rootStore } from "@/store/rootStore.ts";

import styles from "./NightMode.module.scss";
import { StarryCanvas } from "./StarryCanvas.tsx";

type NightModeProps = {
  isVisible?: boolean;
};

export const NightMode = observer(({ isVisible = true }: NightModeProps) => {
  const { t } = useTranslation();
  const [isHiding, setIsHiding] = useState(false);
  const { sendMessage } = useSocket();

  const { gamesStore, usersStore, isIGM } = rootStore;
  const { activeGameId } = gamesStore;
  const { myId } = usersStore;

  useEffect(() => {
    if (!isVisible) {
      setIsHiding(true);
    } else {
      setIsHiding(false);
    }
  }, [isVisible]);

  useEffect(() => {
    if (!activeGameId || !myId || isIGM) return;

    // Звітуємо серверу, що екран ночі змонтовано
    sendMessage(wsEvents.playerSleepConfirm, { gameId: activeGameId, userId: myId });

    return () => {
      // При розмонтуванні екрану ночі — звітуємо, що ми прокинулися
      sendMessage(wsEvents.playerWakeConfirm, { gameId: activeGameId, userId: myId });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGameId, myId, isIGM]);

  return (
    <div
      className={classNames(styles.nightOverlay, {
        [styles.hiding]: isHiding,
      })}
    >
      <StarryCanvas isVisible={isVisible && !isHiding} />

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
