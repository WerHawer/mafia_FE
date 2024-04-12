import { memo, useCallback, useState } from "react";
import classNames from "classnames";
import { GameVideo } from "../GameVideo";
import { useStreams } from "@/hooks/useStreams.ts";
import styles from "./GameVideoContainer.module.scss";

export const GameVideoContainer = memo(() => {
  const { streams, userMediaStream } = useStreams();
  const [sizeTrigger, setSizeTrigger] = useState<number>(0);
  const streamsLength = streams.length;
  const hasActiveSpeaker = false;

  const handleTrigger = useCallback(() => {
    setSizeTrigger((prev) => prev + 1);
  }, []);

  return (
    <div
      className={classNames(styles.container, {
        [styles.threeGrid]: streamsLength >= 5,
        [styles.fourGrid]: streamsLength >= 7,
        [styles.fiveGrid]: hasActiveSpeaker || streamsLength >= 13,
      })}
    >
      {streams.map((item, i) => {
        const isMy = userMediaStream?.id
          ? item.id === userMediaStream.id
          : i === 0;

        return (
          <GameVideo
            key={item.id}
            stream={item.stream}
            // isMyStream={isMy}
            // isActive={i === 0}
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
