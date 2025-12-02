import classNames from "classnames";
import { memo } from "react";

import noAvatar from "@/assets/images/noAvatar.jpg";

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
        <img
          src={avatar ?? noAvatar}
          alt={userName}
          className={classNames(styles.avatar, {
            [styles.speaking]: isSpeaking,
          })}
        />
      </div>
    );
  }
);

VideoPlaceholder.displayName = "VideoPlaceholder";
