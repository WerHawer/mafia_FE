import { SoundOutlined } from "@ant-design/icons";
import { Timer } from "@/components/SpeakerTimer/Timer.tsx";
import { usersStore } from "@/store/usersStore.ts";
import { gamesStore } from "@/store/gamesStore.ts";
import { useCallback } from "react";
import { wsEvents } from "@/config/wsEvents.ts";
import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import { useSocket } from "@/hooks/useSocket.ts";
import { observer } from "mobx-react-lite";

export const SpeakerBlock = observer(() => {
  const { activeGameId, gameFlow, activeGameAlivePlayers } = gamesStore;
  const { getUser } = usersStore;
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();
  const { sendMessage } = useSocket();

  const day = gameFlow.day;
  const speaker = getUser(gameFlow.speaker);

  const handleSpeaker = useCallback(() => {
    let speaker = "";

    if (!gameFlow.speaker) {
      const maxCount = activeGameAlivePlayers.length;
      const index = day - 1 >= maxCount ? 0 : day - 1;
      speaker = activeGameAlivePlayers[index];
    } else {
      const currentSpeakerIndex = activeGameAlivePlayers.findIndex(
        (player) => player === gameFlow.speaker,
      );

      speaker =
        currentSpeakerIndex === activeGameAlivePlayers.length - 1
          ? activeGameAlivePlayers[0]
          : activeGameAlivePlayers[currentSpeakerIndex + 1];
    }

    updateGameFlow({
      speaker,
      isExtraSpeech: false,
    });

    sendMessage(wsEvents.updateSpeaker, {
      gameId: activeGameId,
      userId: speaker,
    });
  }, [
    activeGameAlivePlayers,
    activeGameId,
    day,
    gameFlow.speaker,
    sendMessage,
    updateGameFlow,
  ]);

  if (gameFlow.isVote) return null;

  return (
    <>
      <SoundOutlined
        onClick={handleSpeaker}
        style={{ cursor: "pointer", width: "15%", flexShrink: "0" }}
      />

      {speaker && (
        <p>
          Speaker: {speaker.name} - <Timer resetTrigger={gameFlow.speaker} />
        </p>
      )}
    </>
  );
});
