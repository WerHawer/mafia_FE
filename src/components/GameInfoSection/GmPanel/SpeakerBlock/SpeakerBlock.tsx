import {
  SoundOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
} from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import { Timer } from "@/components/SpeakerTimer/Timer.tsx";
import { wsEvents } from "@/config/wsEvents.ts";
import { useSocket } from "@/hooks/useSocket.ts";
import { rootStore } from "@/store/rootStore.ts";

import styles from "./SpeakerBlock.module.scss";

export const SpeakerBlock = observer(() => {
  const { t } = useTranslation();
  const { gamesStore, usersStore } = rootStore;
  const {
    activeGameId,
    gameFlow,
    activeGameAlivePlayers,
    activeGameKilledPlayers,
    activeGamePlayersWithoutGM,
  } = gamesStore;
  const { getUserName } = usersStore;
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();
  const { sendMessage } = useSocket();

  const day = gameFlow.day;
  const speakerName = getUserName(gameFlow.speaker);
  const hasSpeaker = Boolean(gameFlow.speaker);

  const onStartSpeeches = useCallback(() => {
    if (!hasSpeaker) {
      const maxCount = activeGamePlayersWithoutGM.length;
      let index = day - 1 >= maxCount ? 0 : day - 1;

      while (
        activeGameKilledPlayers.includes(activeGamePlayersWithoutGM[index])
      ) {
        index = (index + 1) % maxCount;
      }

      const speaker = activeGamePlayersWithoutGM[index];

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
    activeGameId,
    activeGameKilledPlayers,
    activeGamePlayersWithoutGM,
    day,
    hasSpeaker,
    sendMessage,
    updateGameFlow,
  ]);

  const onIncSpeaker = useCallback(() => {
    if (!hasSpeaker || activeGameAlivePlayers.length === 0) return;

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

    //video/audio control for speaker could be added here
    // sendMessage(wsEvents.updateSpeaker, {
    //   gameId: activeGameId,
    //   userId: speaker,
    // });
  }, [activeGameAlivePlayers, gameFlow.speaker, hasSpeaker, updateGameFlow]);

  const onDecSpeaker = useCallback(() => {
    if (!hasSpeaker || activeGameAlivePlayers.length === 0) return;

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

    // sendMessage(wsEvents.updateSpeaker, {
    //   gameId: activeGameId,
    //   userId: speaker,
    // });
  }, [activeGameAlivePlayers, gameFlow.speaker, hasSpeaker, updateGameFlow]);

  if (gameFlow.isVote) return null;

  return (
    <div className={styles.speakerBlockContainer}>
      <div className={styles.controlsContainer}>
        {hasSpeaker && (
          <StepBackwardOutlined
            onClick={onDecSpeaker}
            className={styles.controlIcon}
            title={t("speaker.previousSpeaker")}
          />
        )}

        <SoundOutlined
          onClick={onStartSpeeches}
          className={styles.controlIcon}
          title={t("speaker.startSpeeches")}
        />

        {hasSpeaker && (
          <StepForwardOutlined
            onClick={onIncSpeaker}
            className={styles.controlIcon}
            title={t("speaker.nextSpeaker")}
          />
        )}
      </div>

      {speakerName && (
        <p className={styles.speakerInfo}>
          {t("speaker.speaker")}: {speakerName} -{" "}
          <Timer resetTrigger={gameFlow.speaker} />
        </p>
      )}
    </div>
  );
});
