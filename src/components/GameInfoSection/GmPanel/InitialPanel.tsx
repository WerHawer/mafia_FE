import { observer } from "mobx-react-lite";
import { useCallback } from "react";

import {
  useAddRolesToGameMutation,
  useUpdateGameFlowMutation,
} from "@/api/game/queries.ts";
import { rolesCreator } from "@/helpers/rolesCreator.ts";
import { rootStore } from "@/store/rootStore.ts";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";

import styles from "./GmPanel.module.scss";

export const InitialPanel = observer(() => {
  const { gamesStore } = rootStore;
  const { activeGameId, activeGamePlayersWithoutGM } = gamesStore;
  const { mutate: addRoles } = useAddRolesToGameMutation();
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();

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
          updateGameFlow({
            isStarted: true,
            day: 1,
          });
        },
      }
    );
  }, [activeGameId, activeGamePlayersWithoutGM, addRoles, updateGameFlow]);

  return (
    <div className={styles.initialPanelContainer}>
      <Button
        size={ButtonSize.Large}
        variant={ButtonVariant.Success}
        onClick={onStartGame}
      >
        Start game
      </Button>
    </div>
  );
});
