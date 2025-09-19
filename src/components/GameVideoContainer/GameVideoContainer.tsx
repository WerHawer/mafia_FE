import {
  TrackReferenceOrPlaceholder,
  useTracks,
} from "@livekit/components-react";
import classNames from "classnames";
import { Track } from "livekit-client";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";

import { updateGameGM } from "@/api/game/api.ts";
import { rootStore } from "@/store/rootStore.ts";

import { GameVideo } from "../GameVideo";
import styles from "./GameVideoContainer.module.scss";

export const GameVideoContainer = observer(() => {
  const { usersStore, gamesStore } = rootStore;
  const { myId } = usersStore;
  const { speaker, gameFlow, activeGameId } = gamesStore;
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  console.log("GameVideoContainer.tsx:19 | tracks : ", tracks);

  const streamsLength = tracks.length;

  console.log("GameVideoContainer tracks:", {
    length: streamsLength,
    tracks: tracks.map((t) => ({
      participant: t.participant.identity,
      isLocal: t.participant.isLocal,
      isSubscribed: t.publication?.isSubscribed,
      trackExists: !!t.publication?.track,
    })),
  });

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

  const handleCreateMockStreams = useCallback(() => {
    console.log("Mock streams button clicked - not implemented for LiveKit");
  }, []);

  const handleMakeMeGM = useCallback(async () => {
    if (!activeGameId || !myId) return;

    try {
      await updateGameGM({
        gameId: activeGameId,
        userId: myId,
      });
      console.log("You are now the GM!");
    } catch (error) {
      console.error("Failed to set you as GM:", error);
    }
  }, [activeGameId, myId]);

  return (
    <>
      <button
        onClick={handleCreateMockStreams}
        style={{
          position: "fixed",
          top: "10px",
          right: "10px",
          zIndex: 1000,
          padding: "8px 12px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        Debug Tracks ({streamsLength})
      </button>

      <button
        onClick={handleMakeMeGM}
        style={{
          position: "fixed",
          top: "60px",
          right: "10px",
          zIndex: 1000,
          padding: "8px 12px",
          backgroundColor: "#2196F3",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        Make Me GM
      </button>

      <div
        className={classNames(styles.container, {
          [styles.twoGrid]: useFixedGrids.two,
          [styles.threeGrid]: useFixedGrids.three,
          [styles.fourGrid]: useFixedGrids.four,
          [styles.fiveGrid]: useFixedGrids.five,
        })}
      >
        {/* Замінюємо TrackLoop на прямий рендеринг */}
        {tracks.length > 0 ? (
          tracks.map((trackRef) => {
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
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "400px",
              fontSize: "18px",
              color: "white",
              backgroundColor: "#333",
              borderRadius: "8px",
            }}
          >
            <div>
              <p>Немає відеотреків</p>
              <p style={{ fontSize: "14px", marginTop: "10px" }}>
                Треків знайдено: {tracks.length}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
});

GameVideoContainer.displayName = "GameVideoContainer";
