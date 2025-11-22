import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";

import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import { wsEvents } from "@/config/wsEvents.ts";
import { useSocket } from "@/hooks/useSocket.ts";
import { rootStore } from "@/store/rootStore.ts";
import { UserId } from "@/types/user.types.ts";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";

import styles from "./NightResultsModal.module.scss";

export type NightResultsModalProps = {
  killedPlayer: UserId[];
};

export const NightResultsModal = observer(
  ({ killedPlayer = [] }: NightResultsModalProps) => {
    const { gamesStore, usersStore, modalStore } = rootStore;
    const { activeGameId } = gamesStore;
    const { getUserName } = usersStore;
    const { closeModal } = modalStore;
    const { mutate: updateGameFlow } = useUpdateGameFlowMutation();
    const { sendMessage } = useSocket();
    const { t } = useTranslation();

    const isSomeoneKilled = !!killedPlayer.length;
    const playerName = isSomeoneKilled ? getUserName(killedPlayer[0]) : "";

    const giveLastSpeech = useCallback(() => {
      if (!isSomeoneKilled) {
        closeModal();

        return;
      }

      updateGameFlow({
        speaker: killedPlayer[0],
        isVote: false,
        isReVote: false,
        isExtraSpeech: true,
        voted: {},
        proposed: [],
      });

      sendMessage(wsEvents.updateSpeaker, {
        userId: killedPlayer[0],
        gameId: activeGameId!,
      });

      closeModal();
    }, [
      activeGameId,
      closeModal,
      isSomeoneKilled,
      killedPlayer,
      sendMessage,
      updateGameFlow,
    ]);

    return (
      <div className={styles.container}>
        {isSomeoneKilled ? (
          <p className={styles.messageText}>
            <Trans
              i18nKey="nightResults.mafiaKilled"
              values={{ playerName }}
              components={{ strong: <strong /> }}
            />
          </p>
        ) : (
          <p className={styles.messageText}>{t("nightResults.mafiaMissed")}</p>
        )}

        {isSomeoneKilled && (
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
        )}
      </div>
    );
  }
);
