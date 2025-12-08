import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { updateGameGM } from "@/api/game/api.ts";
import { useRestartGameMutation } from "@/api/game/queries.ts";
import { useBatchMediaControls } from "@/hooks/useBatchMediaControls.ts";
import { useMockStreams } from "@/hooks/useMockStreams.ts";
import { routes } from "@/router/routs.ts";
import { rootStore } from "@/store/rootStore.ts";

export const useGMMenu = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { gamesStore, usersStore, isIGM } = rootStore;
  const { activeGameId, activeGamePlayers, activeGameGm, gameFlow } =
    gamesStore;
  const { myId } = usersStore;

  const { unmuteAll, muteAllExceptGM } = useBatchMediaControls({
    roomId: activeGameId || "",
    requesterId: myId,
    allUserIds: activeGamePlayers,
  });

  const { mockStreamsEnabled, handleToggleMockStreams } = useMockStreams();
  const { mutate: restartGame } = useRestartGameMutation();

  const onMakeMeGM = useCallback(async () => {
    if (!activeGameId || !myId) return;

    try {
      await updateGameGM({
        gameId: activeGameId,
        userId: myId,
      });
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Failed to set you as GM:", error);
    }
  }, [activeGameId, myId]);

  const onToggleMockStreams = useCallback(() => {
    handleToggleMockStreams();
    setIsMenuOpen(false);
  }, [handleToggleMockStreams]);

  const onMuteAll = useCallback(() => {
    muteAllExceptGM(activeGameGm);
    setIsMenuOpen(false);
  }, [activeGameGm, muteAllExceptGM]);

  const onUnmuteAll = useCallback(() => {
    unmuteAll();
    setIsMenuOpen(false);
  }, [unmuteAll]);

  const onRestartGame = useCallback(() => {
    if (!activeGameId) return;

    restartGame(activeGameId);
    setIsMenuOpen(false);
  }, [activeGameId, restartGame]);

  const onLeaveGame = useCallback(() => {
    setIsMenuOpen(false);
    navigate(routes.home);
  }, [navigate]);

  return {
    isMenuOpen,
    setIsMenuOpen,
    isIGM,
    mockStreamsEnabled,
    gameFlow,
    onMakeMeGM,
    onToggleMockStreams,
    onMuteAll,
    onUnmuteAll,
    onRestartGame,
    onLeaveGame,
  };
};
