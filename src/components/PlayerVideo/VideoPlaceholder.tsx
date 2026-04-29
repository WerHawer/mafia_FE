import classNames from "classnames";
import { memo } from "react";

import { UserAvatar } from "@/UI/Avatar/UserAvatar.tsx";

import styles from "./VideoPlaceholder.module.scss";

type VideoPlaceholderProps = {
  userName: string;
  avatar?: string;
  isSpeaking?: boolean;
};

export const VideoPlaceholder = memo(
  ({ userName, avatar, isSpeaking = false }: VideoPlaceholderProps) => {
    return (
      <div className={styles.placeholder}>
        <UserAvatar
          avatar={avatar}
          name={userName}
          size="lg"
          className={classNames(styles.avatar, {
            [styles.speaking]: isSpeaking,
          })}
        />
      </div>
    );
  }
);

VideoPlaceholder.displayName = "VideoPlaceholder";
