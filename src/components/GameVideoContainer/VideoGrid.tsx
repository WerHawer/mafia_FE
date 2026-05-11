import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";

import { useGridLayout } from "@/hooks/useGridLayout.ts";
import { useMockStreams } from "@/hooks/useMockStreams";
import { useNightMode } from "@/hooks/useNightMode.ts";
import { getExpectedCameraIdentities } from "@/helpers/expectedVideoParticipants.ts";
import { rootStore } from "@/store/rootStore.ts";

import { GameVideo } from "../GameVideo";
import styles from "./GameVideoContainer.module.scss";

import { GameEntryLoader } from "./GameEntryLoader";

const VIDEO_TRANSITION = { type: "spring", stiffness: 280, damping: 35 };

export const VideoGrid = observer(() => {
  const { gamesStore } = rootStore;
  const { speaker } = gamesStore;
  const { shouldShowMyVideo, shouldShowPlayerVideo } = useNightMode();
  const { allTracks } = useMockStreams();
  const { sandwich } = useGridLayout();

  const isGameStarted = gamesStore.gameFlow.isStarted;

  const { expectLocalCamera, expectedRemoteIds } = useMemo(
    () =>
      getExpectedCameraIdentities({
        myId: rootStore.usersStore.myId,
        isGameStarted,
        shouldShowMyVideo,
        shouldShowPlayerVideo,
        activeGamePlayers: gamesStore.activeGamePlayers,
        activeGameGm: gamesStore.activeGameGm,
        mockStreamsEnabled: gamesStore.mockStreamsEnabled,
      }),
    [
      isGameStarted,
      shouldShowMyVideo,
      shouldShowPlayerVideo,
      gamesStore.activeGamePlayers,
      gamesStore.activeGameGm,
      gamesStore.mockStreamsEnabled,
      rootStore.usersStore.myId,
    ]
  );

  const filteredTracks = useMemo(() => {
    if (!allTracks || allTracks.length === 0) return [];

    const tracks = allTracks.filter((trackRef) => {
      const isMy = trackRef.participant?.isLocal ?? false;
      const participantId = trackRef.participant?.identity || "";

      if (gamesStore.mockStreamsEnabled) {
        if (!isGameStarted) return true;

        return (
          (isMy && shouldShowMyVideo) ||
          (!isMy && shouldShowPlayerVideo(participantId))
        );
      }

      if (!isGameStarted) return true;

      if (isMy) return expectLocalCamera;

      return expectedRemoteIds.has(participantId);
    });

    const {
      killed = [],
      proposed = [],
      isVote,
      isReVote,
    } = gamesStore.gameFlow;
    const { activeGameGm } = gamesStore;
    const { myId } = rootStore.usersStore;
    const isVoting = isVote || isReVote;

    return [...tracks].sort((a, b) => {
      const idA = a.participant?.identity || "";
      const idB = b.participant?.identity || "";

      const getStatusWeight = (id: string) => {
        if (killed.includes(id)) return 3;
        if (id === activeGameGm) return 2;
        // During voting: proposed players float to the front, EXCEPT for the current user's own video
        if (isVoting && proposed.includes(id) && id !== myId) return -1;
        return 0;
      };

      return getStatusWeight(idA) - getStatusWeight(idB);
    });
  }, [
    allTracks,
    isGameStarted,
    expectLocalCamera,
    expectedRemoteIds,
    gamesStore.mockStreamsEnabled,
    shouldShowMyVideo,
    shouldShowPlayerVideo,
    gamesStore.gameFlow.killed,
    gamesStore.gameFlow.proposed,
    gamesStore.gameFlow.isVote,
    gamesStore.gameFlow.isReVote,
    gamesStore.activeGameGm,
    rootStore.usersStore.myId,
  ]);

  if (filteredTracks.length === 0) {
    return <GameEntryLoader />;
  }

  return (
    <LayoutGroup>
      <AnimatePresence>
        {filteredTracks.map((trackRef) => {
          const isMy = trackRef.participant?.isLocal ?? false;
          const isActive = speaker === trackRef.participant?.identity;
          const actualTrack = trackRef.publication?.track;
          const identity = trackRef.participant?.identity || "unknown";

          return (
            <motion.div
              key={identity}
              layoutId={identity}
              layout={true}
              className={styles.gridCell}
              style={
                isActive
                  ? {
                      gridColumn: "2 / 5",
                      // sandwich: speaker spans rows 2–3 (2 rows tall) in a 4-row grid
                      gridRow: sandwich ? "2 / 4" : "1 / 3",
                    }
                  : undefined
              }
              transition={VIDEO_TRANSITION}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <GameVideo
                participant={trackRef.participant!}
                track={actualTrack}
                isMyStream={isMy}
                isActive={isActive}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </LayoutGroup>
  );
});

VideoGrid.displayName = "VideoGrid";
