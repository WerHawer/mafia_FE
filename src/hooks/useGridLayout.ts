import { useMemo } from "react";

import { useMockStreams } from "@/hooks/useMockStreams";
import { rootStore } from "@/store/rootStore.ts";

type GridConfig = {
  two: boolean;
  three: boolean;
  four: boolean;
  five: boolean;
};

export const useGridLayout = (): GridConfig => {
  const { gamesStore } = rootStore;
  const { speaker } = gamesStore;
  const { streamsLength } = useMockStreams();

  return useMemo(() => {
    return {
      two: streamsLength <= 4,
      three: streamsLength > 4 && streamsLength <= 6,
      four: streamsLength > 6 && streamsLength <= 12,
      five: streamsLength > 12 || !!speaker,
    };
  }, [streamsLength, speaker]);
};
