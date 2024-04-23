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
import { observer } from "mobx-react-lite";

export const InitialPanel = observer(() => {
  const { activeGameId, activeGamePlayersWithoutGM, gameFlow } = gamesStore;
  const { mutate: addRoles } = useAddRolesToGameMutation();
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation(gameFlow);

  const handleStartGame = useCallback(() => {
    if (!activeGameId) return;

    const userRoles = rolesCreator(activeGamePlayersWithoutGM);

    addRoles(
      {
        gameId: activeGameId,
        roles: userRoles,
      },
      {
        onSuccess: () => {
          updateGameFlow({
            gameId: activeGameId,
            newFlow: {
              isStarted: true,
              day: 1,
            },
          });
        },
      },
    );
  }, [activeGameId, activeGamePlayersWithoutGM, addRoles, updateGameFlow]);

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
});
