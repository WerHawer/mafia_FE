import { observer } from "mobx-react-lite";
import { useCallback } from "react";

import { GameVideoContainer } from "@/components/GameVideoContainer";
import { VideoConfig } from "@/components/VideoConfig";
import { AudioConfig } from "@/components/AudioConfig/AudioConfig.tsx";

type GameVideoManagerProps = {
  originalStream: MediaStream | null;
  gameId: string;
  showVideoConfig: boolean;
  onCloseVideoConfig: () => void;
  showAudioConfig: boolean;
  onCloseAudioConfig: () => void;
};

export const GameVideoManager = observer(
  ({
    originalStream,
    gameId,
    showVideoConfig,
    onCloseVideoConfig,
    showAudioConfig,
    onCloseAudioConfig,
  }: GameVideoManagerProps) => {
    const handleCloseVideoConfig = useCallback(() => {
      onCloseVideoConfig();
    }, [onCloseVideoConfig]);

    const handleCloseAudioConfig = useCallback(() => {
        onCloseAudioConfig();
    }, [onCloseAudioConfig]);

    return (
      <>
        <VideoConfig
          originalStream={originalStream}
          gameId={gameId}
          onClose={handleCloseVideoConfig}
          isShown={showVideoConfig}
        />

        <AudioConfig
          onClose={handleCloseAudioConfig}
          isShown={showAudioConfig}
        />

        <GameVideoContainer />
      </>
    );
  }
);

GameVideoManager.displayName = "GameVideoManager";
