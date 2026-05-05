import { useMemo } from "react";

import { useMockStreams } from "@/hooks/useMockStreams";
import { rootStore } from "@/store/rootStore.ts";

type GridConfig = {
  two: boolean;
  three: boolean;
  four: boolean;
  five: boolean;
  sandwich: boolean;
};

export const useGridLayout = (): GridConfig => {
  const { gamesStore } = rootStore;
  const { speaker } = gamesStore;
  const { streamsLength } = useMockStreams();

  return useMemo(() => {
    const hasSpeaker = !!speaker;
    const isLargeGame = streamsLength > 10;

    return {
      two: streamsLength <= 4,
      three: streamsLength > 4 && streamsLength <= 6,
      four: streamsLength > 6 && streamsLength <= 12 && !hasSpeaker,
      // Classic speaker layout: speaker sits at top spanning rows 1–2
      five: (streamsLength > 12 && !hasSpeaker) || (hasSpeaker && !isLargeGame),
      // Sandwich layout: small row / big speaker / small row (11+ player games)
      sandwich: hasSpeaker && isLargeGame,
    };
  }, [streamsLength, speaker]);
};
