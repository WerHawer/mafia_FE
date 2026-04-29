import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";

import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import styles from "@/components/Modals/VoteResultsModal/VoteResultsModal.module.scss";
import { Result } from "@/components/Modals/VoteResultsModal/VoteResultsModal.tsx";
import { useBatchMediaControls } from "@/hooks/useBatchMediaControls.ts";
import { gamesStore } from "@/store/gamesStore.ts";
import { modalStore } from "@/store/modalStore.ts";
import { usersStore } from "@/store/usersStore.ts";
import { UserAvatar } from "@/UI/Avatar/UserAvatar.tsx";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";

export const OneSelected = observer(({ result }: { result: Result[] }) => {
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();
  const { getUserName, getUser } = usersStore;
  const { gameFlow } = gamesStore;
  const { t, i18n } = useTranslation();

  const [player, voted] = result[0];
  const playerName = getUserName(player);
  const playerUser = getUser(player);

  const { unmuteSpeaker, muteSpeaker } = useBatchMediaControls();

  const getUkrainianPluralKey = (count: number) => {
    const currentLang = i18n.language;
    if (currentLang !== "ua") return "voteResults.playersVotedAgainst";
    if (count === 1) return "voteResults.playersVotedAgainst_one";
    if (count >= 2 && count <= 4) return "voteResults.playersVotedAgainst_few";
    return "voteResults.playersVotedAgainst_many";
  };

  const giveLastSpeech = useCallback(() => {
    const previousSpeaker = gameFlow.speaker;
    if (previousSpeaker) muteSpeaker(previousSpeaker);
    unmuteSpeaker(player);
    updateGameFlow({
      speaker: player,
      isVote: false,
      isReVote: false,
      isExtraSpeech: true,
      voted: {},
      proposed: [],
      proposedBy: {},
    });
    modalStore.closeModal();
  }, [gameFlow.speaker, muteSpeaker, player, unmuteSpeaker, updateGameFlow]);

  return (
    <div className={styles.container}>
      {/* Chosen player card */}
      <div className={styles.chosenPlayer}>
        <UserAvatar
          avatar={playerUser?.avatar}
          name={playerName}
          customSize={64}
          className={styles.chosenAvatar}
        />
        <div className={styles.chosenInfo}>
          <span className={styles.chosenLabel}>{t("voteResults.chosen", "Обраний")}</span>
          <span className={styles.chosenName}>{playerName}</span>
        </div>
      </div>

      {/* Who voted */}
      {voted.length > 0 ? (
        <div className={styles.votersSection}>
          <p className={styles.secondaryHeader}>
            <Trans
              i18nKey={getUkrainianPluralKey(voted.length)}
              values={{ count: voted.length }}
              components={{ span: <span key="span" className={styles.accentText} /> }}
            />
          </p>

          <div className={classNames(styles.votersList, { [styles.twoColumns]: voted.length > 4 })}>
            {voted.map((voterId) => {
              const voterUser = getUser(voterId);
              const voterName = getUserName(voterId);
              return (
                <div key={voterId} className={styles.voterItem}>
                  <UserAvatar
                    avatar={voterUser?.avatar}
                    name={voterName}
                    customSize={32}
                    className={styles.voterAvatar}
                  />
                  <span className={styles.voterName}>{voterName}</span>
                </div>
              );
            })}
          </div>
        </div>
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
