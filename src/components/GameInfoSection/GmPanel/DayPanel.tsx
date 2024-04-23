import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { SoundOutlined, UsergroupDeleteOutlined } from "@ant-design/icons";
import { Timer } from "@/components/SpeakerTimer/Timer.tsx";
import { gamesStore } from "@/store/gamesStore.ts";
import { usersStore } from "@/store/usersStore.ts";
import { wsEvents } from "@/config/wsEvents.ts";
import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import { useSocket } from "@/hooks/useSocket.ts";
import styles from "./GmPanel.module.scss";

export const DayPanel = observer(() => {
  const { activeGameId, gameFlow, activeGamePlayersWithoutGM } = gamesStore;
  const { getUser } = usersStore;
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation(gameFlow);
  const { sendMessage } = useSocket();

  const speaker = getUser(gameFlow.speaker);
  const day = gameFlow.day;

  const handleSpeaker = useCallback(() => {
    let speaker = "";

    if (!gameFlow.speaker) {
      const maxCount = activeGamePlayersWithoutGM.length;
      const index = day - 1 >= maxCount ? 0 : day - 1;
      speaker = activeGamePlayersWithoutGM[index];
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
        newFlow: {
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

  const handleVoteClick = useCallback(() => {
    updateGameFlow({
      newFlow: {
        isVoteTime: !gameFlow.isVoteTime,
        speaker: "",
      },
      gameId: activeGameId,
    });
  }, [gameFlow, updateGameFlow, activeGameId]);

  return (
    <div className={styles.dayContainer}>
      <p>Day {day}</p>

      <div>
        <SoundOutlined onClick={handleSpeaker} style={{ cursor: "pointer" }} />
        {speaker && (
          <p>
            Speaker: {speaker.name} - <Timer resetTrigger={gameFlow.speaker} />
          </p>
        )}

        {/*TODO: add trigger for timer reset when all players voted*/}
        {gameFlow.isVoteTime && <Timer timer={15} />}
      </div>

      <UsergroupDeleteOutlined
        onClick={handleVoteClick}
        style={{ cursor: "pointer" }}
      />
    </div>
  );
});

DayPanel.displayName = "DayPanel";
