import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";

import { useMockStreams } from "@/hooks/useMockStreams";
import { useNightMode } from "@/hooks/useNightMode.ts";
import { rootStore } from "@/store/rootStore.ts";

import { GameVideo } from "../GameVideo";
import styles from "./GameVideoContainer.module.scss";

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

      return (
        (isMy && shouldShowMyVideo) ||
        (!isMy && shouldShowPlayerVideo(participantId))
      );
    });

    const { killed = [] } = gamesStore.gameFlow;
    const { activeGameGm } = gamesStore;

    return [...tracks].sort((a, b) => {
      const idA = a.participant?.identity || "";
      const idB = b.participant?.identity || "";

      const getStatusWeight = (id: string) => {
        if (killed.includes(id)) return 2;
        if (id === activeGameGm) return 1;
        return 0;
      };

      return getStatusWeight(idA) - getStatusWeight(idB);
    });
  }, [allTracks, shouldShowMyVideo, shouldShowPlayerVideo, gamesStore.gameFlow.killed, gamesStore.activeGameGm]);

  return (
    <LayoutGroup>
      <AnimatePresence>
        {filteredTracks.map((trackRef) => {
          const isMy = trackRef.participant?.isLocal ?? false;
          const isActive = speaker === trackRef.participant?.identity;
          const actualTrack = trackRef.publication?.track;
          const identity = trackRef.participant?.identity || "unknown";

          // When game starts, player's own video gets position:fixed via CSS (.myVideoContainer).
          // We remove the motion.div from grid flow (position: absolute, 0x0)
          // so it doesn't leave an empty grid cell — but keep it mounted to preserve containerRef.
          // Exception: when the player IS the active speaker, they go back into the grid as the large cell.
          const isMyAfterStart = isMy && isGameStarted && !isActive;

          return (
            <motion.div
              key={identity}
              layoutId={!isMyAfterStart ? identity : undefined}
              layout={!isMyAfterStart}
              className={classNames({
                [styles.gridCell]: !isMyAfterStart,
                [styles.noTransform]: isMyAfterStart,
              })}
              style={
                isMyAfterStart
                  ? { position: "absolute", width: 0, height: 0, overflow: "visible" }
                  : isActive
                  ? { gridColumn: "2 / 5", gridRow: "1 / 3" }
                  : undefined
              }
              transition={VIDEO_TRANSITION}
              initial={!isMyAfterStart ? { opacity: 0, scale: 0.95 } : false}
              animate={!isMyAfterStart ? { opacity: 1, scale: 1 } : {}}
              exit={!isMyAfterStart ? { opacity: 0, scale: 0.95 } : {}}
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
