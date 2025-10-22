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

  const onStartGame = useCallback(() => {
    if (!activeGameId) return;

    const userRoles = rolesCreator(activeGamePlayersWithoutGM);

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
  }, [activeGameId, activeGamePlayersWithoutGM, addRoles, startGame]);

  return (
    <div className={styles.initialPanelContainer}>
      <Button
        size={ButtonSize.Large}
        variant={ButtonVariant.Success}
        onClick={onStartGame}
      >
        {t("game.startGame")}
      </Button>
    </div>
  );
});
