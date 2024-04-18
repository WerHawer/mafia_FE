import styles from "./GameVideo.module.scss";
import { useEffect, useMemo } from "react";
import {
  AudioMutedOutlined,
  AudioOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { usersStore } from "@/store/usersStore.ts";
import { useSocket } from "@/hooks/useSocket.ts";
import { wsEvents } from "@/config/wsEvents.ts";

type StreamStatusProps = {
  stream: MediaStream;
  isMyStream?: boolean;
  isIGM?: boolean;
};

export const StreamStatus = observer(
  ({ stream, isMyStream, isIGM }: StreamStatusProps) => {
    const { userStreams } = usersStore;
    const { sendMessage } = useSocket();

    const userStreamData = useMemo(() => {
      return userStreams.find(([id]) => id === stream.id);
    }, [stream, userStreams]);

    const audio = userStreamData?.[1].user.audio ?? true;
    const video = userStreamData?.[1].user.video ?? true;
    const roomId = userStreamData?.[1].roomId ?? "";

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
