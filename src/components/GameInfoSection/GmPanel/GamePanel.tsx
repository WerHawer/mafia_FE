import { useCallback, useMemo } from "react";
import { observer } from "mobx-react-lite";
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
import { rootStore } from "@/store/rootStore.ts";
import { ModalNames } from "@/components/Modals/Modal.types.ts";
import { UserId } from "@/types/user.types.ts";

export const GamePanel = observer(() => {
  const { gamesStore, modalStore, isIGM } = rootStore;
  const {
    activeGameId,
    activeGameGm,
    gameFlow,
    activeGameRoles,
    activeGameAlivePlayers,
  } = gamesStore;
  const { openModal } = modalStore;
  const { sendMessage } = useSocket();

  const { mutate: restartGame } = useRestartGameMutation();
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();

  const killedPlayer: UserId[] = useMemo(() => {
    const { shoot } = gameFlow;
    const { mafia } = activeGameRoles ?? {};

    if (!mafia) return [];
    if (shoot.length === 0) return [];

    const aliveMafiaCount = mafia.filter((id) =>
      activeGameAlivePlayers.includes(id),
    ).length;

    if (shoot.length !== aliveMafiaCount) return [];

    const uniqueTargets = [...new Set(shoot.map(([, targetId]) => targetId))];

    return uniqueTargets.length === 1 ? uniqueTargets : [];
  }, [activeGameAlivePlayers, activeGameRoles, gameFlow]);

  const handleSwitch = useCallback(() => {
    if (gameFlow.isNight && isIGM && gameFlow.day > 1) {
      openModal(ModalNames.NightResultsModal, { killedPlayer });
    }

    updateGameFlow({
      isNight: !gameFlow.isNight,
      day: gameFlow.isNight ? gameFlow.day + 1 : gameFlow.day,
      speaker: "",
      proposed: [],
      shoot: [],
      voted: {},
      isVote: false,
      isExtraSpeech: false,
      wakeUp: "",
      sheriffCheck: "",
      donCheck: "",
    });

    const event = gameFlow.isNight ? wsEvents.startDay : wsEvents.startNight;
    sendMessage(event, { gameId: activeGameId, gm: activeGameGm });
  }, [
    activeGameGm,
    activeGameId,
    gameFlow.day,
    gameFlow.isNight,
    isIGM,
    killedPlayer,
    openModal,
    sendMessage,
    updateGameFlow,
  ]);

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
