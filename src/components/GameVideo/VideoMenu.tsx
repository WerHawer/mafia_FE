import { MoreOutlined } from "@ant-design/icons";
import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";

import {
  useUpdateGameFlowMutation,
  useUpdateGameGMMutation,
} from "@/api/game/queries.ts";
import { rootStore } from "@/store/rootStore.ts";
import { UserId } from "@/types/user.types.ts";

import { PopupMenu, PopupMenuElement } from "../PopupMenu";
import styles from "./GameVideo.module.scss";

type VideoMenuProps = {
  userId?: UserId;
  isCurrentUserGM: boolean;
};

export const VideoMenu = memo(({ userId, isCurrentUserGM }: VideoMenuProps) => {
  const { t } = useTranslation();
  const { mutate: updateGM } = useUpdateGameGMMutation();
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();
  const { gamesStore } = rootStore;
  const { activeGameId, gameFlow } = gamesStore;

  const handleUpdateGM = useCallback(() => {
    if (!userId || !activeGameId) return;
    if (isCurrentUserGM) return;

    updateGM({ gameId: activeGameId, userId });
  }, [activeGameId, isCurrentUserGM, updateGM, userId]);

  const handleKill = useCallback(() => {
    if (!userId) return;

    updateGameFlow({
      speaker: "",
      isExtraSpeech: false,
      killed: [...gameFlow.killed, userId],
    });
  }, [gameFlow.killed, updateGameFlow, userId]);

  return (
    <PopupMenu
      className={styles.videoMenu}
      content={
        <>
          <PopupMenuElement onClick={handleUpdateGM}>
            {t("videoMenu.doGM")}
          </PopupMenuElement>
          <PopupMenuElement onClick={handleKill}>
            {t("videoMenu.kill")}
          </PopupMenuElement>
        </>
      }
    >
      <MoreOutlined className={styles.menu} />
    </PopupMenu>
  );
});

VideoMenu.displayName = "VideoMenu";
