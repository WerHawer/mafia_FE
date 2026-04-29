import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import { Result } from "@/components/Modals/VoteResultsModal/VoteResultsModal.tsx";
import { gamesStore } from "@/store/gamesStore.ts";
import { modalStore } from "@/store/modalStore.ts";
import { usersStore } from "@/store/usersStore.ts";
import { UserAvatar } from "@/UI/Avatar/UserAvatar.tsx";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";

import styles from "./VoteResultsModal.module.scss";

export const Draw = observer(({ result }: { result: Result[] }) => {
  const { t } = useTranslation();
  const { getUserName, getUser } = usersStore;
  const { gameFlow } = gamesStore;
  const { closeModal } = modalStore;
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();

  const candidates = useMemo(() => result.map((res) => res[0]), [result]);
  
  // Track if an action was explicitly taken, so we don't trigger the fallback on unmount
  const actionTakenRef = useRef(false);

  const newProposed = useMemo(() => {
    return gameFlow.proposed.filter((id) => candidates.includes(id));
  }, [gameFlow.proposed, candidates]);

  const onFinishVoting = useCallback(() => {
    actionTakenRef.current = true;
    updateGameFlow({
      isVote: false,
      isReVote: false,
      proposed: [],
      proposedBy: {},
      voted: {},
    });
    closeModal();
  }, [closeModal, updateGameFlow]);

  const onInstantRevote = useCallback(() => {
    actionTakenRef.current = true;
    updateGameFlow({
      proposed: newProposed,
      voted: {},
      isReVote: true,
      isVote: true, // start the revote immediately
    });
    closeModal();
  }, [closeModal, newProposed, updateGameFlow]);

  const onCandidateSpeeches = useCallback(() => {
    actionTakenRef.current = true;
    updateGameFlow({
      proposed: newProposed,
      isReVote: true,
      isVote: false, // pause voting for speeches
    });
    closeModal();
  }, [closeModal, newProposed, updateGameFlow]);

  // Fallback: if modal is closed (e.g., overlay click) without choosing an action
  useEffect(() => {
    return () => {
      if (!actionTakenRef.current) {
        if (gameFlow.isReVote) {
          updateGameFlow({
            isVote: false,
            isReVote: false,
            proposed: [],
            proposedBy: {},
            voted: {},
          });
        } else {
          updateGameFlow({
            proposed: newProposed,
            isReVote: true,
            isVote: false,
          });
        }
      }
    };
  }, [gameFlow.isReVote, newProposed, updateGameFlow]);

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

          <div className={classNames(styles.votersList, { [styles.twoColumns]: candidates.length > 4 })}>
            {candidates.map((candidate) => {
              const user = getUser(candidate);
              const name = getUserName(candidate);
              return (
                <div key={candidate} className={styles.voterItem}>
                  <UserAvatar
                    avatar={user?.avatar}
                    name={name}
                    customSize={32}
                    className={styles.voterAvatar}
                  />
                  <span className={styles.voterName}>{name}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className={styles.buttonContainer}>
        {gameFlow.isReVote ? (
          <Button
            onClick={onFinishVoting}
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Medium}
            uppercase
          >
            {t("voteResults.finishVoting")}
          </Button>
        ) : (
          <>
            <Button
              onClick={onCandidateSpeeches}
              variant={ButtonVariant.Primary}
              size={ButtonSize.Medium}
              uppercase
            >
              {t("gm.candidateSpeeches", "Промови кандидатів")}
            </Button>
            <Button
              onClick={onInstantRevote}
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Medium}
              uppercase
            >
              {t("voteResults.restartVote")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
});

Draw.displayName = "DrawModal";
