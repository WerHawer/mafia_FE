import { observer } from "mobx-react-lite";
import { useCallback } from "react";

import { GameVideoContainer } from "@/components/GameVideoContainer";
import { VideoConfig } from "@/components/VideoConfig";
import { AudioConfig } from "@/components/AudioConfig/AudioConfig.tsx";
import { useAdaptiveQuality } from "@/hooks/useAdaptiveQuality.ts";
import { MediaStreamError } from "@/hooks/useUserMediaStream.ts";

type GameVideoManagerProps = {
  originalStream: MediaStream | null;
  gameId: string;
  quality: ReturnType<typeof useAdaptiveQuality>;
  showVideoConfig: boolean;
  onCloseVideoConfig: () => void;
  showAudioConfig: boolean;
  onCloseAudioConfig: () => void;
  streamError?: MediaStreamError | null;
  videoDeviceId?: string;
  onSelectVideoDevice?: (id: string) => void;
};

export const GameVideoManager = observer(
  ({
    originalStream,
    gameId,
    quality,
    showVideoConfig,
    onCloseVideoConfig,
    showAudioConfig,
    onCloseAudioConfig,
    streamError,
    videoDeviceId,
    onSelectVideoDevice,
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
          quality={quality}
          streamError={streamError}
          videoDeviceId={videoDeviceId}
          onSelectVideoDevice={onSelectVideoDevice}
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
