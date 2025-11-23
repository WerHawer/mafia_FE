import { observer } from "mobx-react-lite";
import { useMemo } from "react";

import { useMockStreams } from "@/hooks/useMockStreams";
import { useNightMode } from "@/hooks/useNightMode.ts";
import { rootStore } from "@/store/rootStore.ts";

import { GameVideo } from "../GameVideo";

export const VideoGrid = observer(() => {
  const { gamesStore } = rootStore;
  const { speaker } = gamesStore;
  const { shouldShowMyVideo, shouldShowPlayerVideo } = useNightMode();
  const { allTracks } = useMockStreams();

  const filteredTracks = useMemo(() => {
    if (!allTracks || allTracks.length === 0) return [];

    return allTracks.filter((trackRef) => {
      const isMy = trackRef.participant?.isLocal ?? false;
      const participantId = trackRef.participant?.identity || "";

      return (
        (isMy && shouldShowMyVideo) ||
        (!isMy && shouldShowPlayerVideo(participantId))
      );
    });
  }, [allTracks, shouldShowMyVideo, shouldShowPlayerVideo]);

  return (
    <>
      {filteredTracks.map((trackRef) => {
        const isMy = trackRef.participant?.isLocal ?? false;
        const isActive = speaker === trackRef.participant?.identity;
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
      })}
    </>
  );
});

VideoGrid.displayName = "VideoGrid";
