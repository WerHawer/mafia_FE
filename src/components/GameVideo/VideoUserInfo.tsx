import { observer } from "mobx-react-lite";
import { useMemo } from "react";

import { rootStore } from "@/store/rootStore.ts";
import { RoleIcon } from "@/UI/RoleIcon";

import styles from "./GameVideo.module.scss";

type VideoUserInfoProps = {
  userName: string;
  userId: string;
};

export const VideoUserInfo = observer(
  ({ userName, userId }: VideoUserInfoProps) => {
    const { gamesStore, isIGM } = rootStore;
    const { getUserRole, activeGamePlayersWithoutGM } = gamesStore;
    const role = getUserRole(userId);

    const userNumber = useMemo(
      () => activeGamePlayersWithoutGM.findIndex((id) => id === userId) + 1,
      [activeGamePlayersWithoutGM, userId],
    );

    return (
      <div className={styles.userInfo}>
        {isIGM && <RoleIcon role={role} />}

        <div>
          {userName} {userNumber ? `#${userNumber}` : ""}
        </div>
      </div>
    );
  },
);

VideoUserInfo.displayName = "VideoUserInfo";
