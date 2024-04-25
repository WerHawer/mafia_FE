import { PopupMenu, PopupMenuElement } from "../PopupMenu";
import styles from "./GameVideo.module.scss";
import { memo, useCallback } from "react";
import {
  useUpdateGameFlowMutation,
  useUpdateGameGMMutation,
} from "@/api/game/queries.ts";
import { gamesStore } from "@/store/gamesStore.ts";
import { UserId } from "@/types/user.types.ts";
import { MoreOutlined } from "@ant-design/icons";

type VideoMenuProps = {
  userId?: UserId;
  isCurrentUserGM: boolean;
};

export const VideoMenu = memo(({ userId, isCurrentUserGM }: VideoMenuProps) => {
  const { mutate: updateGM } = useUpdateGameGMMutation();
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();
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
      content={
        <>
          <PopupMenuElement onClick={handleUpdateGM}>Do GM</PopupMenuElement>
          <PopupMenuElement onClick={handleKill}>Kill</PopupMenuElement>
        </>
      }
    >
      <MoreOutlined className={styles.menu} />
    </PopupMenu>
  );
});

VideoMenu.displayName = "VideoMenu";
