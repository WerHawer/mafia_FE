import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import classNames from "classnames";
import { GameVideo } from "../GameVideo";
import { useStreams } from "@/hooks/useStreams.ts";
import styles from "./GameVideoContainer.module.scss";
import { usersStore } from "@/store/usersStore.ts";
import { gamesStore } from "@/store/gamesStore.ts";

export const GameVideoContainer = observer(() => {
  const { streams, userMediaStream } = useStreams();
  const { userStreamsMap, myId } = usersStore;
  const { isUserGM, speaker } = gamesStore;
  const [sizeTrigger, setSizeTrigger] = useState<number>(0);
  const streamsLength = streams.length;
  const hasActiveSpeaker = !!speaker;

  useEffect(() => {
    streams.forEach((stream) => {
      const streamId = stream.id;

      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];

      const userStreamData = userStreamsMap.get(streamId);

      if (!userStreamData) return;

      const { audio = true, video = true, offParams } = userStreamData.user;
      const { useTo } = userStreamData;
      const isSelfMute = offParams === "self";

      if (streamId === userMediaStream?.id && !isSelfMute) return;
      if (isUserGM(myId) && !isSelfMute) return;
      // if (isUserGM(id) && !isSelfMute) return;

      if (useTo && !isSelfMute) {
        const isForMe = useTo.includes(myId);

        audioTrack.enabled = isForMe ? audio : !audio;
        videoTrack.enabled = isForMe ? video : !video;

        return;
      }

      audioTrack.enabled = audio;
      videoTrack.enabled = video;
    });
  }, [streams, userMediaStream, isUserGM, myId, userStreamsMap]);

  const handleTrigger = useCallback(() => {
    setSizeTrigger((prev) => prev + 1);
  }, []);

  return (
    <div
      className={classNames(styles.container, {
        [styles.threeGrid]: streamsLength > 5,
        [styles.fourGrid]: streamsLength > 7,
        [styles.fiveGrid]:
          (hasActiveSpeaker && speaker !== myId) || streamsLength > 13,
      })}
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
            streamsLength={streams.length}
            trigger={sizeTrigger}
            handleTrigger={handleTrigger}
          />
        );
      })}
    </div>
  );
});

GameVideoContainer.displayName = "GameVideoContainer";
