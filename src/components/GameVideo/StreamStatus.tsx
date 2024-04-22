import styles from "./GameVideo.module.scss";
import { useMemo } from "react";
import {
  AudioMutedOutlined,
  AudioOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useSocket } from "@/hooks/useSocket.ts";
import { wsEvents } from "@/config/wsEvents.ts";
import { streamStore } from "@/store/streamsStore.ts";

type StreamStatusProps = {
  stream: MediaStream;
  isMyStream?: boolean;
  isIGM?: boolean;
};

export const StreamStatus = observer(
  ({ stream, isMyStream, isIGM }: StreamStatusProps) => {
    const { getUserStreamInfo, userStreamsMap } = streamStore;
    const { sendMessage } = useSocket();

    // TODO: re-work this to use stream by fact, not this data...
    const { audio, video, roomId } = useMemo(() => {
      const userStreamData = getUserStreamInfo(stream.id);
      const audio = userStreamData?.user.audio ?? true;
      const video = userStreamData?.user.video ?? true;
      const roomId = userStreamData?.roomId ?? "";

      return { audio, video, roomId };
      // we need userStreamsMap to be updated in write way
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getUserStreamInfo, stream, userStreamsMap]);

    const handleAudioClick = () => {
      if (!isMyStream && !isIGM) return;

      sendMessage(wsEvents.userAudioStatus, {
        streamId: stream.id,
        roomId,
        audio: !audio,
        offParams: "self",
      });
    };

    const handleVideoClick = () => {
      if (!isMyStream && !isIGM) return;

      sendMessage(wsEvents.userVideoStatus, {
        streamId: stream.id,
        roomId,
        video: !video,
        offParams: "self",
      });
    };

    const AudioIcon = audio ? AudioOutlined : AudioMutedOutlined;
    return (
      <div className={styles.statusIconsContainer}>
        <VideoCameraOutlined
          className={classNames(styles.statusIcon, {
            [styles.statusDisabled]: !video,
          })}
          onClick={handleVideoClick}
        />{" "}
        <AudioIcon
          className={classNames(styles.statusIcon, {
            [styles.statusDisabled]: !audio,
          })}
          onClick={handleAudioClick}
        />
      </div>
    );
  },
);

StreamStatus.displayName = "StreamStatus";
