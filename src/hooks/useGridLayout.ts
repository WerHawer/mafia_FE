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
  const { speaker, gameFlow } = gamesStore;
  const { streamsLength } = useMockStreams();

  return useMemo(() => {
    const usersMinMax = {
      four: gameFlow.isStarted ? 5 : 4,
      six: gameFlow.isStarted ? 7 : 6,
      twelve: gameFlow.isStarted ? 13 : 12,
    };

    return {
      two: streamsLength <= usersMinMax.four,
      three:
        streamsLength > usersMinMax.four && streamsLength <= usersMinMax.six,
      four:
        streamsLength > usersMinMax.six && streamsLength <= usersMinMax.twelve,
      five: streamsLength > usersMinMax.twelve || !!speaker,
    };
  }, [streamsLength, gameFlow.isStarted, speaker]);
};
