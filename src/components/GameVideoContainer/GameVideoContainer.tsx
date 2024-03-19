import { memo, useEffect, useState } from "react";
import { GameVideo } from "../GameVideo";
import { Stream, useStreams } from "../../hooks/useStreams.ts";
import styles from "./GameVideoContainer.module.scss";
import classNames from "classnames";

export const GameVideoContainer = memo(() => {
  const [testStreams, setTestStreams] = useState<Stream[]>([]);
  const { streams, userMediaStream } = useStreams();

  useEffect(() => {
    if (!userMediaStream) return;

    const s = streams.map((_, i) => ({
      id: userMediaStream.id + i,
      stream: userMediaStream,
    }));

    setTestStreams(s);
  }, [userMediaStream, streams]);

  return (
    <div className={classNames(styles.container, styles.fiveGrid)}>
      {testStreams.map((item, i) => {
        // const isMy = userMediaStream?.id
        //   ? item.id === userMediaStream.id
        //   : i === 0;

        return (
          <GameVideo
            key={item.id}
            stream={item.stream}
            isMyStream={i === 0}
            muted
            isActive={i === 6}
          />
        );
      })}
    </div>
  );
});
