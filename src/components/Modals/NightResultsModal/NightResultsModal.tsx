import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";

import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import { NightResultsModalProps } from "@/components/Modals/Modal.types.ts";
import { useBatchMediaControls } from "@/hooks/useBatchMediaControls.ts";
import { rootStore } from "@/store/rootStore.ts";
import { Roles } from "@/types/game.types.ts";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import { Typography } from "@/UI/Typography";

import styles from "./NightResultsModal.module.scss";

// Removed local definition of NightResultsModalProps
// TODO: rework this file. It's too big and complex. Create separate components for each log type.

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

    const outcomeType = isSomeoneKilled
      ? "killed"
      : mafiaMissReason === "savedByDoctor"
        ? "safe"
        : "missed";

    const outcomeIcon = isSomeoneKilled
      ? "💀"
      : mafiaMissReason === "savedByDoctor"
        ? "🛡️"
        : "🌙";

    return (
      <div className={styles.container}>
        <Typography variant="sectionHeader" className={styles.title}>
          {t("nightResults.summaryTitle")}
        </Typography>

        {/* ── Night action log ── */}
        <div className={styles.logsContainer}>
          {nightActionLogs?.targetedByMafia &&
            nightActionLogs.targetedByMafia.length > 0 && (
              <div className={classNames(styles.logRow, styles.logRow_mafia)}>
                <Typography variant="body" className={styles.logText}>
                  <Trans
                    i18nKey="nightResults.logMafia"
                    values={{
                      playerName: formatTargetedByMafia(
                        nightActionLogs.targetedByMafia
                      ),
                    }}
                    components={{ strong: <strong key="strong" /> }}
                  />
                </Typography>
              </div>
            )}

          {nightActionLogs?.blockedByProstitute && (
            <div
              className={classNames(styles.logRow, styles.logRow_prostitute)}
            >
              <Typography variant="body" className={styles.logText}>
                <Trans
                  i18nKey="nightResults.logProstitute"
                  values={{
                    playerName: getUserName(
                      nightActionLogs.blockedByProstitute
                    ),
                  }}
                  components={{ strong: <strong key="strong" /> }}
                />
              </Typography>
            </div>
          )}

          {nightActionLogs?.savedByDoctor && (
            <div className={classNames(styles.logRow, styles.logRow_doctor)}>
              <Typography variant="body" className={styles.logText}>
                <Trans
                  i18nKey="nightResults.logDoctor"
                  values={{
                    playerName: getUserName(nightActionLogs.savedByDoctor),
                  }}
                  components={{ strong: <strong key="strong" /> }}
                />
              </Typography>
            </div>
          )}

          {nightActionLogs?.donChecked && (
            <div className={classNames(styles.logRow, styles.logRow_don)}>
              <Typography variant="body" className={styles.logText}>
                <Trans
                  i18nKey="nightResults.logDon"
                  values={{
                    playerName: getUserName(nightActionLogs.donChecked),
                    result: getResultForDon(nightActionLogs.donChecked),
                  }}
                  components={{ strong: <strong key="strong" /> }}
                />
              </Typography>
            </div>
          )}

          {nightActionLogs?.sheriffChecked && (
            <div className={classNames(styles.logRow, styles.logRow_sheriff)}>
              <Typography variant="body" className={styles.logText}>
                <Trans
                  i18nKey="nightResults.logSheriff"
                  values={{
                    playerName: getUserName(nightActionLogs.sheriffChecked),
                    result: getResultForSheriff(nightActionLogs.sheriffChecked),
                  }}
                  components={{ strong: <strong key="strong" /> }}
                />
              </Typography>
            </div>
          )}
        </div>

        {/* ── Outcome ── */}
        <div className={classNames(styles.outcome, styles[outcomeType])}>
          <span className={styles.outcomeIcon}>{outcomeIcon}</span>
          <Typography variant="body" className={styles.outcomeText}>
            {isSomeoneKilled ? (
              <Trans
                i18nKey="nightResults.mafiaKilled"
                values={{ playerName }}
                components={{ strong: <strong key="strong" /> }}
              />
            ) : mafiaMissReason === "savedByDoctor" ? (
              <Trans
                i18nKey="nightResults.doctorSaved"
                values={{
                  playerName: getUserName(nightActionLogs.savedByDoctor),
                }}
                components={{ strong: <strong key="strong" /> }}
              />
            ) : mafiaMissReason === "noShots" ? (
              t("nightResults.noShots")
            ) : mafiaMissReason === "notAllShot" ? (
              t("nightResults.notAllShot", {
                shots: nightActionLogs?.totalShots,
                alive: nightActionLogs?.aliveMafiaCount,
              })
            ) : mafiaMissReason === "splitShots" ? (
              t("nightResults.splitShots")
            ) : (
              t("nightResults.mafiaMissed")
            )}
          </Typography>
        </div>

        {/* ── Action ── */}
        <div className={classNames(styles.actions)}>
          {isSomeoneKilled ? (
            <Button
              onClick={giveLastSpeech}
              variant={ButtonVariant.Primary}
              size={ButtonSize.Medium}
            >
              <Trans
                i18nKey="nightResults.lastSpeech"
                values={{ playerName }}
                components={{ strong: <strong key="strong" /> }}
              />
            </Button>
          ) : (
            <Button
              onClick={closeModal}
              variant={ButtonVariant.Tertiary}
              size={ButtonSize.MS}
            >
              {t("nightResults.close")}
            </Button>
          )}
        </div>
      </div>
    );
  }
);
