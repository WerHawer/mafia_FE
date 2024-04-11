import { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { ButtonSize, ButtonVariant } from "../../../UI/Button/ButtonTypes.ts";
import { Button } from "../../../UI/Button";
import { rolesCreator } from "../../../helpers/rolesCreator.ts";
import { gamesStore } from "../../../store/gamesStore.ts";
import {
  useAddRolesToGameMutation,
  useRestartGameMutation,
  useUpdateGameFlowMutation,
} from "../../../api/game/queries.ts";
import styles from "../GameInfoSection.module.scss";
import { UsersInfo } from "./UsersInfo.tsx";

export const GmPanel = observer(() => {
  const { activeGameId, activeGameGm, activeGamePlayers, gameFlow } =
    gamesStore;
  const { mutate: addRoles } = useAddRolesToGameMutation();
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();
  const { mutate: restartGame } = useRestartGameMutation();

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
    <div className={styles.gmPanel}>
      <div className={styles.buttonContainer}>
        {!gameFlow.isStarted ? (
          <Button
            size={ButtonSize.Large}
            variant={ButtonVariant.Success}
            onClick={handleStartGame}
          >
            Start game
          </Button>
        ) : (
          <p onClick={() => restartGame(activeGameId)}>Game Started</p>
        )}
      </div>

      <UsersInfo />
    </div>
  );
});
