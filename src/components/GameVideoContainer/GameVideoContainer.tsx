import { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import classNames from "classnames";
import { GameVideo } from "../GameVideo";
import styles from "./GameVideoContainer.module.scss";
import { usersStore } from "@/store/usersStore.ts";
import { gamesStore } from "@/store/gamesStore.ts";
import { streamStore } from "@/store/streamsStore.ts";

export const GameVideoContainer = observer(() => {
  const { myId } = usersStore;
  const { isUserGM, speaker, gameFlow } = gamesStore;
  const {
    myStream: userMediaStream,
    streams,
    streamsLength,
    userStreamsMap,
    manageStreamTracks,
  } = streamStore;
  const ref = useRef<HTMLDivElement>(null);

  const VIDEO_COUNT = {
    ThreeGrid: gameFlow.isStarted ? 5 : 4,
    FourGrid: gameFlow.isStarted ? 7 : 6,
    FiveGrid: gameFlow.isStarted ? 13 : 12,
  };

  useEffect(() => {
    manageStreamTracks(myId, isUserGM(myId));
  }, [isUserGM, manageStreamTracks, myId, userStreamsMap]);

  return (
    <div
      className={classNames(styles.container, {
        [styles.twoGrid]: streamsLength <= VIDEO_COUNT.ThreeGrid,
        [styles.threeGrid]:
          streamsLength > VIDEO_COUNT.ThreeGrid &&
          streamsLength <= VIDEO_COUNT.FourGrid,
        [styles.fourGrid]:
          streamsLength > VIDEO_COUNT.FourGrid &&
          streamsLength <= VIDEO_COUNT.FiveGrid,
        [styles.fiveGrid]:
          (!!speaker && speaker !== myId) ||
          streamsLength > VIDEO_COUNT.FiveGrid,
      })}
      ref={ref}
    >
      {streams.map((stream) => {
        const isMy = stream.id === userMediaStream?.id;
        const userId = userStreamsMap.get(stream.id)?.user.id;
        const isActive = speaker === userId;

        return (
          <GameVideo
            key={stream.id}
            stream={stream}
            isMyStream={isMy}
            isActive={isActive}
            muted
            userId={userId}
          />
        );
      })}
    </div>
  );
});

GameVideoContainer.displayName = "GameVideoContainer";
