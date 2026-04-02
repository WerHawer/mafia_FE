import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";

import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import { useBatchMediaControls } from "@/hooks/useBatchMediaControls.ts";
import { rootStore } from "@/store/rootStore.ts";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";

import { NightActionLogs, NightResultsModalProps } from "@/components/Modals/Modal.types.ts";
import { Roles } from "@/types/game.types.ts";
import styles from "./NightResultsModal.module.scss";

// Removed local definition of NightResultsModalProps

export const NightResultsModal = observer(
  ({ nightActionLogs }: NightResultsModalProps) => {
    const { gamesStore, usersStore, modalStore } = rootStore;
    const { gameFlow, getUserRole } = gamesStore;
    const { getUserName } = usersStore;
    const { closeModal } = modalStore;
    const { mutate: updateGameFlow } = useUpdateGameFlowMutation();
    const { t } = useTranslation();
    const { unmuteSpeaker, muteSpeaker } = useBatchMediaControls();

    const killedPlayerId = nightActionLogs?.killedPlayer;
    const isSomeoneKilled = !!killedPlayerId;
    const playerName = killedPlayerId ? getUserName(killedPlayerId) : "";
    const mafiaMissReason = nightActionLogs?.mafiaMissReason;

    const giveLastSpeech = useCallback(() => {
      if (!isSomeoneKilled || !killedPlayerId) {
        closeModal();

        return;
      }

      const previousSpeaker = gameFlow.speaker;

      if (previousSpeaker) {
        muteSpeaker(previousSpeaker);
      }

      unmuteSpeaker(killedPlayerId);

      updateGameFlow({
        speaker: killedPlayerId,
        isVote: false,
        isReVote: false,
        isExtraSpeech: true,
        voted: {},
        proposed: [],
      });

      closeModal();
    }, [
      closeModal,
      gameFlow.speaker,
      isSomeoneKilled,
      killedPlayerId,
      muteSpeaker,
      unmuteSpeaker,
      updateGameFlow,
    ]);

    const getResultForSheriff = (id: string) => {
      const role = getUserRole(id);
      return role === Roles.Mafia || role === Roles.Don 
        ? t("nightResults.resultMafia") 
        : t("nightResults.resultNotMafia");
    };

    const getResultForDon = (id: string) => {
      const role = getUserRole(id);
      return role === Roles.Sheriff 
        ? t("nightResults.resultSheriff") 
        : t("nightResults.resultNotSheriff");
    };

    const formatTargetedByMafia = (targets?: string[]) => {
      if (!targets || targets.length === 0) return t("roles.unknown");
      return targets.map(getUserName).join(", ");
    };

    return (
      <div className={styles.container}>
        <h3 className={styles.title}>{t("nightResults.summaryTitle")}</h3>

        <div className={styles.logsContainer}>
          {nightActionLogs?.targetedByMafia && nightActionLogs.targetedByMafia.length > 0 && (
            <p className={styles.logText}>
              <Trans
                i18nKey="nightResults.logMafia"
                values={{ playerName: formatTargetedByMafia(nightActionLogs.targetedByMafia) }}
                components={{ strong: <strong /> }}
              />
            </p>
          )}

          {nightActionLogs?.blockedByProstitute && (
            <p className={styles.logText}>
              <Trans
                i18nKey="nightResults.logProstitute"
                values={{ playerName: getUserName(nightActionLogs.blockedByProstitute) }}
                components={{ strong: <strong /> }}
              />
            </p>
          )}

          {nightActionLogs?.savedByDoctor && (
            <p className={styles.logText}>
              <Trans
                i18nKey="nightResults.logDoctor"
                values={{ playerName: getUserName(nightActionLogs.savedByDoctor) }}
                components={{ strong: <strong /> }}
              />
            </p>
          )}

          {nightActionLogs?.donChecked && (
            <p className={styles.logText}>
              <Trans
                i18nKey="nightResults.logDon"
                values={{ 
                  playerName: getUserName(nightActionLogs.donChecked),
                  result: getResultForDon(nightActionLogs.donChecked)
                }}
                components={{ strong: <strong /> }}
              />
            </p>
          )}

          {nightActionLogs?.sheriffChecked && (
            <p className={styles.logText}>
              <Trans
                i18nKey="nightResults.logSheriff"
                values={{ 
                  playerName: getUserName(nightActionLogs.sheriffChecked),
                  result: getResultForSheriff(nightActionLogs.sheriffChecked)
                }}
                components={{ strong: <strong /> }}
              />
            </p>
          )}
        </div>

        <hr className={styles.divider} />

        {isSomeoneKilled ? (
          <p className={styles.messageText}>
            <Trans
              i18nKey="nightResults.mafiaKilled"
              values={{ playerName }}
              components={{ strong: <strong /> }}
            />
          </p>
        ) : mafiaMissReason === "savedByDoctor" ? (
          <p className={styles.messageText}>
            <Trans
              i18nKey="nightResults.doctorSaved"
              values={{ playerName: getUserName(nightActionLogs?.savedByDoctor!) }}
              components={{ strong: <strong /> }}
            />
          </p>
        ) : mafiaMissReason === "noShots" ? (
          <p className={styles.messageText}>{t("nightResults.noShots")}</p>
        ) : mafiaMissReason === "notAllShot" ? (
          <p className={styles.messageText}>{t("nightResults.notAllShot", { shots: nightActionLogs?.totalShots, alive: nightActionLogs?.aliveMafiaCount })}</p>
        ) : mafiaMissReason === "splitShots" ? (
          <p className={styles.messageText}>{t("nightResults.splitShots")}</p>
        ) : (
          <p className={styles.messageText}>{t("nightResults.mafiaMissed")}</p>
        )}

        {isSomeoneKilled ? (
           <Button
             onClick={giveLastSpeech}
             variant={ButtonVariant.Secondary}
             size={ButtonSize.Large}
             uppercase
           >
             <Trans
               i18nKey="nightResults.lastSpeech"
               values={{ playerName }}
               components={{ strong: <strong /> }}
             />
           </Button>
        ) : (
           <Button
             onClick={closeModal}
             variant={ButtonVariant.Secondary}
             size={ButtonSize.Large}
             uppercase
           >
             {t("nightResults.close")}
           </Button>
        )}
      </div>
    );
  }
);
