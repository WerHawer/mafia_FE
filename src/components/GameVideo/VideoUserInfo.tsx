import Tippy from "@tippyjs/react";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { rootStore } from "@/store/rootStore.ts";
import { RoleIcon } from "@/UI/RoleIcon";

import styles from "./GameVideo.module.scss";

type VideoUserInfoProps = {
  userName: string;
  userId: string;
};

export const VideoUserInfo = observer(
  ({ userName, userId }: VideoUserInfoProps) => {
    const { t } = useTranslation();
    const { gamesStore, isIGM } = rootStore;
    const { getUserRole, activeGamePlayersWithoutGM, isUserGM } = gamesStore;
    const role = getUserRole(userId);
    const isGM = isUserGM(userId);

    const userNumber = useMemo(
      () => activeGamePlayersWithoutGM.findIndex((id) => id === userId) + 1,
      [activeGamePlayersWithoutGM, userId]
    );

    return (
      <div className={styles.userInfo}>
        {(isIGM || gamesStore.isMeObserver || gamesStore.gameFlow.isPostGame) && !isGM && <RoleIcon role={role} />}

        <div className={styles.userNameContainer}>
          {userName} {userNumber ? `#${userNumber}` : ""}
          {isIGM && gamesStore.observers.includes(userId) && (
            <Tippy
              content={t("game.ghostModeActive", "Ghost Mode Active")}
              theme="role-tooltip"
              animation="scale"
              duration={[200, 150]}
              delay={[200, 0]}
              placement="top"
            >
              <span className={styles.ghostBadgeLarge}>👻</span>
            </Tippy>
          )}
        </div>
      </div>
    );
  }
);

VideoUserInfo.displayName = "VideoUserInfo";
