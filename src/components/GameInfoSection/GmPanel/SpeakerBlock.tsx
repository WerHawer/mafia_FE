import {
  SoundOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
} from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";

import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import { Timer } from "@/components/SpeakerTimer/Timer.tsx";
import { wsEvents } from "@/config/wsEvents.ts";
import { useSocket } from "@/hooks/useSocket.ts";
import { rootStore } from "@/store/rootStore.ts";

import styles from "./SpeakerBlock.module.scss";

export const SpeakerBlock = observer(() => {
  const { gamesStore, usersStore } = rootStore;
  const { activeGameId, gameFlow, activeGameAlivePlayers } = gamesStore;
  const { getUserName } = usersStore;
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();
  const { sendMessage } = useSocket();

  const day = gameFlow.day;
  const speakerName = getUserName(gameFlow.speaker);

  const handleSpeaker = useCallback(() => {
    if (!gameFlow.speaker) {
      const maxCount = activeGameAlivePlayers.length;
      const index = day - 1 >= maxCount ? 0 : day - 1;
      const speaker = activeGameAlivePlayers[index];

      updateGameFlow({
        speaker,
        isExtraSpeech: false,
      });

      sendMessage(wsEvents.updateSpeaker, {
        gameId: activeGameId,
        userId: speaker,
      });
    }
  }, [
    activeGameAlivePlayers,
    activeGameId,
    day,
    gameFlow.speaker,
    sendMessage,
    updateGameFlow,
  ]);

  const handleForwardSpeaker = useCallback(() => {
    if (!gameFlow.speaker || activeGameAlivePlayers.length === 0) return;

    const currentSpeakerIndex = activeGameAlivePlayers.findIndex(
      (player) => player === gameFlow.speaker
    );

    const speaker =
      currentSpeakerIndex === activeGameAlivePlayers.length - 1
        ? activeGameAlivePlayers[0]
        : activeGameAlivePlayers[currentSpeakerIndex + 1];

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
    gameFlow.speaker,
    sendMessage,
    updateGameFlow,
  ]);

  const handleBackwardSpeaker = useCallback(() => {
    if (!gameFlow.speaker || activeGameAlivePlayers.length === 0) return;

    const currentSpeakerIndex = activeGameAlivePlayers.findIndex(
      (player) => player === gameFlow.speaker
    );

    const speaker =
      currentSpeakerIndex === 0
        ? activeGameAlivePlayers[activeGameAlivePlayers.length - 1]
        : activeGameAlivePlayers[currentSpeakerIndex - 1];

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
    gameFlow.speaker,
    sendMessage,
    updateGameFlow,
  ]);

  if (gameFlow.isVote) return null;

  return (
    <div className={styles.speakerBlockContainer}>
      <div className={styles.controlsContainer}>
        <StepBackwardOutlined
          onClick={handleBackwardSpeaker}
          className={styles.controlIcon}
        />
        <SoundOutlined onClick={handleSpeaker} className={styles.controlIcon} />
        <StepForwardOutlined
          onClick={handleForwardSpeaker}
          className={styles.controlIcon}
        />
      </div>

      {speakerName && (
        <p className={styles.speakerInfo}>
          Speaker: {speakerName} - <Timer resetTrigger={gameFlow.speaker} />
        </p>
      )}
    </div>
  );
});
