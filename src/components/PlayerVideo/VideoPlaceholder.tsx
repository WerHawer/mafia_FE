import { memo } from "react";

import noAvatar from "@/assets/images/noAvatar.jpg";

import styles from "./VideoPlaceholder.module.scss";

type VideoPlaceholderProps = {
  userName: string;
  avatar?: string;
};

export const VideoPlaceholder = memo(
  ({ userName, avatar }: VideoPlaceholderProps) => {
    return (
      <div className={styles.placeholder}>
        <img
          src={avatar ?? noAvatar}
          alt={userName}
          className={styles.avatar}
        />
      </div>
    );
  }
);

VideoPlaceholder.displayName = "VideoPlaceholder";
