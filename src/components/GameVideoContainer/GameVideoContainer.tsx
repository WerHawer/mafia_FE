import classNames from "classnames";
import { observer } from "mobx-react-lite";

import { useMockStreams } from "@/hooks/useMockStreams";
import { rootStore } from "@/store/rootStore.ts";

import { GameVideo } from "../GameVideo";
import styles from "./GameVideoContainer.module.scss";

type GameVideoContainerProps = {
  className?: string;
};

export const GameVideoContainer = observer(
  ({ className }: GameVideoContainerProps) => {
    const { usersStore, gamesStore } = rootStore;
    const { myId } = usersStore;
    const { speaker, gameFlow } = gamesStore;

    // Use the mock streams hook
    const { allTracks, streamsLength } = useMockStreams();

    const usersMinMax = {
      four: gameFlow.isStarted ? 5 : 4,
      six: gameFlow.isStarted ? 7 : 6,
      twelve: gameFlow.isStarted ? 13 : 12,
    };

    const useFixedGrids = {
      two: streamsLength <= usersMinMax.four,
      three:
        streamsLength > usersMinMax.four && streamsLength <= usersMinMax.six,
      four:
        streamsLength > usersMinMax.six && streamsLength <= usersMinMax.twelve,
      five:
        streamsLength > usersMinMax.twelve || (!!speaker && speaker !== myId),
    };

    return (
      <div
        className={classNames(
          styles.container,
          {
            [styles.twoGrid]: useFixedGrids.two,
            [styles.threeGrid]: useFixedGrids.three,
            [styles.fourGrid]: useFixedGrids.four,
            [styles.fiveGrid]: useFixedGrids.five,
          },
          className
        )}
      >
        {allTracks?.length > 0
          ? allTracks.map((trackRef) => {
              const isMy = trackRef.participant?.isLocal ?? false;
              const isActive = speaker === trackRef.participant?.identity;

              // Get the actual track from the publication
              const actualTrack = trackRef.publication?.track;

              return (
                <GameVideo
                  key={trackRef.participant?.identity || "unknown"}
                  participant={trackRef.participant!}
                  track={actualTrack}
                  isMyStream={isMy}
                  isActive={isActive}
                />
              );
            })
          : null}
      </div>
    );
  }
);

GameVideoContainer.displayName = "GameVideoContainer";
