import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import {
  useAddRolesToGameMutation,
  useStartGameMutation,
} from "@/api/game/queries.ts";
import { rolesCreator } from "@/helpers/rolesCreator.ts";
import { rootStore } from "@/store/rootStore.ts";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";

import styles from "./GmPanel.module.scss";

export const InitialPanel = observer(() => {
  const { t } = useTranslation();
  const { gamesStore } = rootStore;
  const { activeGameId, activeGamePlayersWithoutGM } = gamesStore;
  const { mutate: addRoles } = useAddRolesToGameMutation();
  const { mutate: startGame } = useStartGameMutation();

  const canStartGame = activeGamePlayersWithoutGM.length >= 4;

  const onStartGame = useCallback(() => {
    if (!activeGameId || !gamesStore.activeGame || !canStartGame) return;

    const { additionalRoles = [] } = gamesStore.activeGame;
    const playersCount = activeGamePlayersWithoutGM.length;
    let mafiaCount = 1;

    if (playersCount >= 8) {
      mafiaCount = 3;
    } else if (playersCount === 7) {
      mafiaCount = 2;
    } else {
      mafiaCount = 1; // 4, 5, 6 players
    }

    const userRoles = rolesCreator(activeGamePlayersWithoutGM, {
      mafiaCount,
      additionalRoles,
    });

    addRoles(
      {
        gameId: activeGameId,
        roles: userRoles,
      },
      {
        onSuccess: () => {
          startGame(activeGameId);
        },
      }
    );
  }, [
    activeGameId,
    activeGamePlayersWithoutGM,
    addRoles,
    startGame,
    gamesStore.activeGame,
    canStartGame,
  ]);

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
