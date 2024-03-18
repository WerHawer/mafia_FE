import { memo } from "react";
import { GameVideo } from "../GameVideo";
import { useStreams } from "../../hooks/useStreams.ts";
import styles from "./GameVideoContainer.module.scss";

export const GameVideoContainer = memo(() => {
  const { streams, userMediaStream } = useStreams();

  return (
    <div className={styles.container}>
      {streams.map((item, i) => {
        const isMy = userMediaStream?.id
          ? item.id === userMediaStream.id
          : i === 0;

        return (
          <GameVideo
            key={item.id}
            stream={item.stream}
            isMyStream={isMy}
            muted={isMy}
          />
        );
      })}
    </div>
  );
});
