import { useCallback } from "react";
import { gamesStore } from "@/store/gamesStore.ts";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import {
  useAddRolesToGameMutation,
  useUpdateGameFlowMutation,
} from "@/api/game/queries.ts";
import { rolesCreator } from "@/helpers/rolesCreator.ts";
import styles from "./GmPanel.module.scss";

export const InitialPanel = () => {
  const { activeGameId, activeGameGm, activeGamePlayers, gameFlow } =
    gamesStore;
  const { mutate: addRoles } = useAddRolesToGameMutation();
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();

  const handleStartGame = useCallback(() => {
    if (!activeGameId || !activeGameGm) return;

    const userRoles = rolesCreator(activeGamePlayers, activeGameGm);

    addRoles(
      {
        gameId: activeGameId,
        roles: userRoles,
      },
      {
        onSuccess: () => {
          updateGameFlow({
            gameId: activeGameId,
            flow: {
              ...gameFlow,
              isStarted: true,
            },
          });
        },
      },
    );
  }, [
    activeGameId,
    activeGameGm,
    activeGamePlayers,
    addRoles,
    updateGameFlow,
    gameFlow,
  ]);

  return (
    <div className={styles.initialPanelContainer}>
      <Button
        size={ButtonSize.Large}
        variant={ButtonVariant.Success}
        onClick={handleStartGame}
      >
        Start game
      </Button>
    </div>
  );
};
