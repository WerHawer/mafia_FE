import { observer } from "mobx-react-lite";
import { rootStore } from "@/store/rootStore.ts";
import { useCallback } from "react";
import { UserId } from "@/types/user.types.ts";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import { wsEvents } from "@/config/wsEvents.ts";
import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import { useSocket } from "@/hooks/useSocket.ts";

export type NightResultsModalProps = {
  killedPlayer: UserId[];
};

export const NightResultsModal = observer(
  ({ killedPlayer }: NightResultsModalProps) => {
    const { gamesStore, usersStore, modalStore } = rootStore;
    const { activeGameId } = gamesStore;
    const { getUserName } = usersStore;
    const { closeModal } = modalStore;
    const { mutate: updateGameFlow } = useUpdateGameFlowMutation();
    const { sendMessage } = useSocket();

    const isSomeoneKilled = killedPlayer.length === 1;
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
        gameId: activeGameId,
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
      <div>
        {isSomeoneKilled ? (
          <p>Mafia killed {playerName}</p>
        ) : (
          <p>Mafia missed and all citizens still alive after night</p>
        )}

        {isSomeoneKilled && (
          <Button
            onClick={giveLastSpeech}
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Large}
            uppercase
          >
            Last speech for {playerName}
          </Button>
        )}
      </div>
    );
  },
);
