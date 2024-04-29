import { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { gamesStore } from "@/store/gamesStore.ts";
import {
  useRestartGameMutation,
  useUpdateGameFlowMutation,
} from "@/api/game/queries.ts";
import { Switcher } from "@/UI/Switcher";
import styles from "./GmPanel.module.scss";
import { useSocket } from "@/hooks/useSocket.ts";
import { wsEvents } from "@/config/wsEvents.ts";
import { NightPanel } from "@/components/GameInfoSection/GmPanel/NightPanel.tsx";
import { DayPanel } from "./DayPanel";

export const GamePanel = observer(() => {
  const { activeGameId, activeGameGm, gameFlow } = gamesStore;
  const { sendMessage } = useSocket();

  const { mutate: restartGame } = useRestartGameMutation();
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();

  const handleSwitch = useCallback(() => {
    updateGameFlow(
      {
        isNight: !gameFlow.isNight,
        day: gameFlow.isNight ? gameFlow.day + 1 : gameFlow.day,
        speaker: "",
        proposed: [],
        voted: {},
        isVote: false,
        isExtraSpeech: false,
        wakeUp: "",
        sheriffCheck: "",
        donCheck: "",
      },
      {
        onSuccess: () => {
          const event = gameFlow.isNight
            ? wsEvents.startDay
            : wsEvents.startNight;

          sendMessage(event, { gameId: activeGameId, gm: activeGameGm });
        },
      },
    );
  }, [activeGameGm, activeGameId, gameFlow, sendMessage, updateGameFlow]);

  return (
    <>
      <p className={styles.restart} onClick={() => restartGame(activeGameId)}>
        Restart
      </p>

      <div className={styles.dayNightPanelContainer}>
        <Switcher checked={gameFlow.isNight} onChange={handleSwitch} />
        {gameFlow.isNight ? <p>Night</p> : <p>Day {gameFlow.day}</p>}
      </div>

      {gameFlow.isNight ? <NightPanel /> : <DayPanel />}
    </>
  );
});

GamePanel.displayName = "GamePanel";
