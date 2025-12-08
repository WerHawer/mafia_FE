import { observer } from "mobx-react-lite";
import { useCallback } from "react";

import { GameVideoContainer } from "@/components/GameVideoContainer";
import { VideoConfig } from "@/components/VideoConfig";

type GameVideoManagerProps = {
  originalStream: MediaStream | null;
  gameId: string;
  showVideoConfig: boolean;
  onCloseVideoConfig: () => void;
};

export const GameVideoManager = observer(
  ({
    originalStream,
    gameId,
    showVideoConfig,
    onCloseVideoConfig,
  }: GameVideoManagerProps) => {
    const handleCloseVideoConfig = useCallback(() => {
      onCloseVideoConfig();
    }, [onCloseVideoConfig]);

    return (
      <>
        <VideoConfig
          originalStream={originalStream}
          gameId={gameId}
          onClose={handleCloseVideoConfig}
          isShown={showVideoConfig}
        />

        <GameVideoContainer />
      </>
    );
  }
);

GameVideoManager.displayName = "GameVideoManager";
