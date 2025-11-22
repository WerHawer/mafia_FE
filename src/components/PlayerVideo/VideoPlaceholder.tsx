import { memo } from "react";

import styles from "./VideoPlaceholder.module.scss";

type VideoPlaceholderProps = {
  userName: string;
  avatar?: string;
};

export const VideoPlaceholder = memo(
  ({ userName, avatar }: VideoPlaceholderProps) => {
    const getInitials = (name: string): string => {
      const words = name.trim().split(" ");
      if (words.length >= 2) {
        return `${words[0][0]}${words[1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };

    const getBackgroundColor = (name: string): string => {
      const colors = [
        "#5865f2", // accent secondary (blue-purple)
        "#ffa657", // accent tertiary (orange)
        "#ffff27", // accent primary (yellow)
        "#2ea043", // success (green)
        "#58a6ff", // info (light blue)
        "#ff6b6b", // red variant
        "#4ecdc4", // teal
        "#a29bfe", // light purple
      ];

      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }

      return colors[Math.abs(hash) % colors.length];
    };

    return (
      <div className={styles.placeholder}>
        {avatar ? (
          <img src={avatar} alt={userName} className={styles.avatar} />
        ) : (
          <div
            className={styles.initials}
            style={{ backgroundColor: getBackgroundColor(userName) }}
          >
            {getInitials(userName)}
          </div>
        )}
      </div>
    );
  }
);

VideoPlaceholder.displayName = "VideoPlaceholder";
