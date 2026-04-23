import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";

import { useMockStreams } from "@/hooks/useMockStreams";
import { useNightMode } from "@/hooks/useNightMode.ts";
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

  const isGameStarted = gamesStore.gameFlow.isStarted;

  const filteredTracks = useMemo(() => {
    if (!allTracks || allTracks.length === 0) return [];

    const tracks = allTracks.filter((trackRef) => {
      const isMy = trackRef.participant?.isLocal ?? false;
      const participantId = trackRef.participant?.identity || "";

      // Before game starts — always show everyone
      if (!isGameStarted) return true;

      return (
        (isMy && shouldShowMyVideo) ||
        (!isMy && shouldShowPlayerVideo(participantId))
      );
    });

    const { killed = [], proposed = [], isVote, isReVote } = gamesStore.gameFlow;
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
                  ? { gridColumn: "2 / 5", gridRow: "1 / 3" }
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
