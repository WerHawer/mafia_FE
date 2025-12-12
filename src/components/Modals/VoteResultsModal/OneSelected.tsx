import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";

import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import styles from "@/components/Modals/VoteResultsModal/VoteResultsModal.module.scss";
import { Result } from "@/components/Modals/VoteResultsModal/VoteResultsModal.tsx";
import { wsEvents } from "@/config/wsEvents.ts";
import { useBatchMediaControls } from "@/hooks/useBatchMediaControls.ts";
import { useSocket } from "@/hooks/useSocket.ts";
import { gamesStore } from "@/store/gamesStore.ts";
import { usersStore } from "@/store/usersStore.ts";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";

export const OneSelected = observer(({ result }: { result: Result[] }) => {
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();
  const { getUserName, myId } = usersStore;
  const { activeGameId, activeGameAlivePlayers, gameFlow } = gamesStore;
  const { t, i18n } = useTranslation();

  const [player, voted] = result[0];
  const playerName = getUserName(player);

  const { unmuteSpeaker, muteSpeaker } = useBatchMediaControls({
    roomId: activeGameId || "",
    requesterId: myId,
    allUserIds: activeGameAlivePlayers,
  });

  // Helper function to get the correct plural form translation key for Ukrainian
  const getUkrainianPluralKey = (count: number) => {
    const currentLang = i18n.language;
    if (currentLang !== "ua") return "voteResults.playersVotedAgainst";

    if (count === 1) return "voteResults.playersVotedAgainst_one";
    if (count >= 2 && count <= 4) return "voteResults.playersVotedAgainst_few";

    return "voteResults.playersVotedAgainst_many";
  };

  const giveLastSpeech = useCallback(() => {
    const previousSpeaker = gameFlow.speaker;

    if (previousSpeaker) {
      muteSpeaker(previousSpeaker);
    }

    unmuteSpeaker(player);

    updateGameFlow({
      speaker: player,
      isVote: false,
      isReVote: false,
      isExtraSpeech: true,
      voted: {},
      proposed: [],
    });
  }, [gameFlow.speaker, muteSpeaker, player, unmuteSpeaker, updateGameFlow]);

  return (
    <div className={styles.container}>
      <h4 className={styles.header}>
        <Trans
          i18nKey="voteResults.playerChosen"
          values={{ playerName }}
          components={{ span: <span className={styles.accentText} /> }}
        />
      </h4>

      {voted.length > 0 ? (
        <>
          <p className={styles.secondaryHeader}>
            <Trans
              i18nKey={getUkrainianPluralKey(voted.length)}
              values={{ count: voted.length }}
              components={{ span: <span className={styles.accentText} /> }}
            />
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
        <h4 className={styles.secondaryHeader}>
          {t("voteResults.singleUserProposed")}
        </h4>
      )}

      <div className={styles.buttonContainer}>
        <Button
          onClick={giveLastSpeech}
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Medium}
          uppercase
        >
          {t("voteResults.lastSpeechFor", { playerName })}
        </Button>
      </div>
    </div>
  );
});
