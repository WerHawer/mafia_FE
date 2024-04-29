import { observer } from "mobx-react-lite";
import styles from "./GameVideo.module.scss";
import { RoleIcon } from "@/UI/RoleIcon";
import { rootStore } from "@/store/rootStore.ts";
import { useMemo } from "react";

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
      [activeGamePlayersWithoutGM],
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
