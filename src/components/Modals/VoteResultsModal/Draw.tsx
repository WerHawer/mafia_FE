import { observer } from "mobx-react-lite";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import { Result } from "@/components/Modals/VoteResultsModal/VoteResultsModal.tsx";
import { gamesStore } from "@/store/gamesStore.ts";
import { modalStore } from "@/store/modalStore.ts";
import { usersStore } from "@/store/usersStore.ts";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";

import styles from "./VoteResultsModal.module.scss";

export const Draw = observer(({ result }: { result: Result[] }) => {
  const { t } = useTranslation();
  const { getUserName } = usersStore;
  const { gameFlow } = gamesStore;
  const { closeModal } = modalStore;
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();

  const candidates = useMemo(() => result.map((res) => res[0]), [result]);

  const onButtonClick = useCallback(() => {
    if (gameFlow.isReVote) {
      updateGameFlow({
        isVote: false,
        isReVote: false,
        proposed: [],
        voted: {},
      });

      closeModal();

      return;
    }

    const newProposed = gameFlow.proposed.filter((id) =>
      candidates.includes(id)
    );

    updateGameFlow({
      proposed: newProposed,
      voted: {},
      isReVote: true,
    });

    closeModal();
  }, [
    candidates,
    closeModal,
    gameFlow.isReVote,
    gameFlow.proposed,
    updateGameFlow,
  ]);

  return (
    <div className={styles.container}>
      <h4 className={styles.header}>
        {gameFlow.isReVote
          ? t("voteResults.secondDraw")
          : t("voteResults.draw")}
      </h4>

      {gameFlow.isReVote ? (
        <p className={styles.secondaryHeader}>{t("voteResults.noDecision")}</p>
      ) : (
        <>
          <p className={styles.secondaryHeader}>
            {t("voteResults.usersToRevote")}
          </p>

          <ul className={styles.list}>
            {candidates.map((candidate) => (
              <li key={candidate} className={styles.listItem}>
                {getUserName(candidate)}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className={styles.buttonContainer}>
        <Button
          onClick={onButtonClick}
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Medium}
          uppercase
        >
          {gameFlow.isReVote
            ? t("voteResults.finishVoting")
            : t("voteResults.restartVote")}
        </Button>
      </div>
    </div>
  );
});

Draw.displayName = "DrawModal";
