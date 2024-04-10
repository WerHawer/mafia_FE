import { useCallback } from "react";
import { ButtonSize, ButtonVariant } from "../../../UI/Button/ButtonTypes.ts";
import { Button } from "../../../UI/Button";
import { rolesCreator } from "../../../helpers/rolesCreator.ts";
import { gamesStore } from "../../../store/gamesStore.ts";
import {
  useAddRolesToGameMutation,
  useUpdateGameFlowMutation,
} from "../../../api/game/queries.ts";
import styles from "../GameInfoSection.module.scss";

export const GmPanel = () => {
  const { activeGameId, activeGameGm, activeGaveUserIds, gameFlow } =
    gamesStore;
  const { mutate: addRoles } = useAddRolesToGameMutation();
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();
  const handleStartGame = useCallback(() => {
    if (!activeGameId || !activeGameGm) return;

    const userRoles = rolesCreator(activeGaveUserIds, activeGameGm);

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
              isStarted: true,
            },
          });
        },
      },
    );
  }, [activeGameId, activeGameGm, activeGaveUserIds, addRoles, updateGameFlow]);

  return (
    <div className={styles.gmPanel}>
      {!gameFlow.isStarted ? (
        <div className={styles.buttonContainer}>
          <Button
            size={ButtonSize.Large}
            variant={ButtonVariant.Success}
            onClick={handleStartGame}
          >
            Start game
          </Button>
        </div>
      ) : (
        <p
          onClick={() =>
            updateGameFlow({
              gameId: activeGameId || "",
              flow: { isStarted: false },
            })
          }
        >
          Game is Started
        </p>
      )}
    </div>
  );
};
