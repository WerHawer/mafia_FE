import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef } from "react";

import { updateGameGM } from "@/api/game/api.ts";
import { rootStore } from "@/store/rootStore.ts";
import { streamStore } from "@/store/streamsStore.ts";

import { GameVideo } from "../GameVideo";
import styles from "./GameVideoContainer.module.scss";

export const GameVideoContainer = observer(() => {
  const { usersStore, gamesStore } = rootStore;
  const { myId } = usersStore;
  const { isUserGM, speaker, gameFlow, activeGamePlayers, activeGameId } =
    gamesStore;

  const {
    myStream: userMediaStream,
    userStreamsMap,
    manageStreamTracks,
    getFilteredStreams,
    createMockStreamsForPlayers,
  } = streamStore;

  const ref = useRef<HTMLDivElement>(null);

  const filterVariant = gameFlow.isVote ? "opposite" : "direct";
  const arrForFilter = gameFlow.isVote ? gameFlow.proposed : gameFlow.killed;

  const filteredStreams = getFilteredStreams({
    arrForFilter,
    variant: filterVariant,
    myId,
  });

  const streamsLength = filteredStreams.length;

  const usersMinMax = {
    four: gameFlow.isStarted ? 5 : 4,
    six: gameFlow.isStarted ? 7 : 6,
    twelve: gameFlow.isStarted ? 13 : 12,
  };

  const useFixedGrids = {
    two: streamsLength <= usersMinMax.four,
    three: streamsLength > usersMinMax.four && streamsLength <= usersMinMax.six,
    four:
      streamsLength > usersMinMax.six && streamsLength <= usersMinMax.twelve,
    five: streamsLength > usersMinMax.twelve || (!!speaker && speaker !== myId),
  };

  useEffect(() => {
    manageStreamTracks(filteredStreams, myId, isUserGM(myId));
  }, [isUserGM, manageStreamTracks, myId, userStreamsMap, filteredStreams]);

  // const handleCreateMockStreams = useCallback(() => {
  //   createMockStreamsForPlayers();
  // }, [createMockStreamsForPlayers]);
  //
  // const handleMakeMeGM = useCallback(async () => {
  //   if (!activeGameId || !myId) return;
  //
  //   try {
  //     await updateGameGM({
  //       gameId: activeGameId,
  //       userId: myId,
  //     });
  //     console.log("You are now the GM!");
  //   } catch (error) {
  //     console.error("Failed to set you as GM:", error);
  //   }
  // }, [activeGameId, myId]);

  return (
    <>
      {/*<button*/}
      {/*  onClick={handleCreateMockStreams}*/}
      {/*  style={{*/}
      {/*    position: "fixed",*/}
      {/*    top: "10px",*/}
      {/*    right: "10px",*/}
      {/*    zIndex: 1000,*/}
      {/*    padding: "8px 12px",*/}
      {/*    backgroundColor: "#4CAF50",*/}
      {/*    color: "white",*/}
      {/*    border: "none",*/}
      {/*    borderRadius: "4px",*/}
      {/*    cursor: "pointer",*/}
      {/*    fontSize: "14px",*/}
      {/*  }}*/}
      {/*>*/}
      {/*  Create Test Streams*/}
      {/*</button>*/}

      {/*<button*/}
      {/*  onClick={handleMakeMeGM}*/}
      {/*  style={{*/}
      {/*    position: "fixed",*/}
      {/*    top: "60px",*/}
      {/*    right: "10px",*/}
      {/*    zIndex: 1000,*/}
      {/*    padding: "8px 12px",*/}
      {/*    backgroundColor: "#2196F3",*/}
      {/*    color: "white",*/}
      {/*    border: "none",*/}
      {/*    borderRadius: "4px",*/}
      {/*    cursor: "pointer",*/}
      {/*    fontSize: "14px",*/}
      {/*  }}*/}
      {/*>*/}
      {/*  Make Me GM*/}
      {/*</button>*/}

      <div
        className={classNames(styles.container, {
          [styles.twoGrid]: useFixedGrids.two,
          [styles.threeGrid]: useFixedGrids.three,
          [styles.fourGrid]: useFixedGrids.four,
          [styles.fiveGrid]: useFixedGrids.five,
        })}
        ref={ref}
      >
        {filteredStreams.map((stream) => {
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
    </>
  );
});

GameVideoContainer.displayName = "GameVideoContainer";
