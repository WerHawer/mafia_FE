import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useStartGameMutation } from "@/api/game/queries.ts";
import { rootStore } from "@/store/rootStore.ts";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";

import styles from "./GmPanel.module.scss";

export const InitialPanel = observer(() => {
  const { t } = useTranslation();
  const { gamesStore } = rootStore;
  const { activeGameId, activeGamePlayersWithoutGM } = gamesStore;
  const { mutate: startGame } = useStartGameMutation();

  const canStartGame = activeGamePlayersWithoutGM.length >= 4;

  const onStartGame = useCallback(() => {
    if (!activeGameId || !canStartGame) return;

    startGame(activeGameId);
  }, [activeGameId, canStartGame, startGame]);

  return (
    <div className={styles.initialPanelContainer}>
      <div className={styles.startButtonWrapper}>
        <Button
          size={ButtonSize.Large}
          variant={ButtonVariant.Success}
          onClick={onStartGame}
          disabled={!canStartGame}
        >
          {t("game.startGame")}
        </Button>
        {!canStartGame && (
          <div className={styles.startNote}>
            {t("game.minPlayersNote", "Мінімум 5 людей (з ведучим)")}
          </div>
        )}
      </div>
    </div>
  );
});
