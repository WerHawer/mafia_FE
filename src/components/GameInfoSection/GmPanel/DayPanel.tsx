import { SoundOutlined } from "@ant-design/icons";
import { SpeakerTimer } from "@/components/SpeakerTimer/SpeakerTimer.tsx";
import { gamesStore } from "@/store/gamesStore.ts";
import { usersStore } from "@/store/usersStore.ts";
import { useCallback } from "react";
import { wsEvents } from "@/config/wsEvents.ts";
import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import { useSocket } from "@/hooks/useSocket.ts";
import { observer } from "mobx-react-lite";

export const DayPanel = observer(() => {
  const { activeGameId, gameFlow, activeGamePlayersWithoutGM } = gamesStore;
  const { getUser } = usersStore;
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();
  const { sendMessage } = useSocket();

  const speaker = getUser(gameFlow.speaker);
  const day = gameFlow.day;

  const handleSpeaker = useCallback(() => {
    let speaker = "";

    if (!gameFlow.speaker) {
      speaker = activeGamePlayersWithoutGM[day - 1];
    } else {
      const currentSpeakerIndex = activeGamePlayersWithoutGM.findIndex(
        (player) => player === gameFlow.speaker,
      );

      speaker =
        currentSpeakerIndex === activeGamePlayersWithoutGM.length - 1
          ? activeGamePlayersWithoutGM[0]
          : activeGamePlayersWithoutGM[currentSpeakerIndex + 1];
    }

    if (gameFlow.killed.includes(speaker)) {
      const firstAlivePlayer = activeGamePlayersWithoutGM.find(
        (player) => !gameFlow.killed.includes(player),
      );

      speaker = firstAlivePlayer!;
    }

    updateGameFlow(
      {
        flow: {
          ...gameFlow,
          speaker,
        },
        gameId: activeGameId,
      },
      {
        onSuccess: () => {
          sendMessage(wsEvents.updateSpeaker, {
            gameId: activeGameId,
            userId: speaker,
          });
        },
      },
    );
  }, [
    activeGameId,
    activeGamePlayersWithoutGM,
    day,
    gameFlow,
    sendMessage,
    updateGameFlow,
  ]);

  return (
    <>
      <p>Day {day}</p>

      <SoundOutlined onClick={handleSpeaker} style={{ cursor: "pointer" }} />

      {speaker && (
        <p>
          Speaker: {speaker.name} - <SpeakerTimer />
        </p>
      )}
    </>
  );
});

DayPanel.displayName = "DayPanel";
