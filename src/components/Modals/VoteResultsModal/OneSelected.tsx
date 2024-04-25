import { useCallback } from "react";
import { observer } from "mobx-react-lite";
import styles from "@/components/Modals/VoteResultsModal/VoteResultsModal.module.scss";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import { wsEvents } from "@/config/wsEvents.ts";
import { useSocket } from "@/hooks/useSocket.ts";
import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import { usersStore } from "@/store/usersStore.ts";
import { Result } from "@/components/Modals/VoteResultsModal/VoteResultsModal.tsx";
import { gamesStore } from "@/store/gamesStore.ts";

export const OneSelected = observer(({ result }: { result: Result[] }) => {
  const { sendMessage } = useSocket();
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();
  const { getUserName } = usersStore;
  const { activeGameId } = gamesStore;

  const [player, voted] = result[0];
  const playerName = getUserName(player);

  const giveLastSpeech = useCallback(() => {
    updateGameFlow({
      speaker: player,
      isVote: false,
      isReVote: false,
      isExtraSpeech: true,
      voted: {},
      proposed: [],
    });

    sendMessage(wsEvents.updateSpeaker, {
      userId: player,
      gameId: activeGameId,
    });
  }, [activeGameId, player, sendMessage, updateGameFlow]);

  return (
    <div className={styles.container}>
      <h4 className={styles.header}>
        <span className={styles.accentText}>{playerName}</span> was chosen on
        the vote
      </h4>

      {voted.length > 0 ? (
        <>
          <p className={styles.secondaryHeader}>
            <span className={styles.accentText}>{voted.length}</span> players
            voted against this player:
          </p>

          <ul className={styles.list}>
            {voted.map((player) => (
              <li key={player} className={styles.listItem}>
                {getUserName(player)}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <h4 className={styles.secondaryHeader}>Single user was proposed</h4>
      )}

      <div className={styles.buttonContainer}>
        <Button
          onClick={giveLastSpeech}
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Large}
          uppercase
        >
          Last speech for {playerName}
        </Button>
      </div>
    </div>
  );
});
