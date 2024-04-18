import { PopupMenu, PopupMenuElement } from "../PopupMenu";
import styles from "./GameVideo.module.scss";
import { memo, useCallback } from "react";
import { useUpdateGameGMMutation } from "@/api/game/queries.ts";
import { gamesStore } from "@/store/gamesStore.ts";
import { UserId } from "@/types/user.types.ts";
import { MoreOutlined } from "@ant-design/icons";

type VideoMenuProps = {
  userId?: UserId;
  isCurrentUserGM: boolean;
};

export const VideoMenu = memo(({ userId, isCurrentUserGM }: VideoMenuProps) => {
  const { mutate: updateGM } = useUpdateGameGMMutation();
  const { activeGameId } = gamesStore;

  const handleUpdateGM = useCallback(() => {
    if (!userId || !activeGameId) return;
    if (isCurrentUserGM) return;

    updateGM({ gameId: activeGameId, userId });
  }, [activeGameId, isCurrentUserGM, updateGM, userId]);

  return (
    <PopupMenu
      content={
        <PopupMenuElement onClick={handleUpdateGM}>Do GM</PopupMenuElement>
      }
    >
      <MoreOutlined className={styles.menu} />
    </PopupMenu>
  );
});

VideoMenu.displayName = "VideoMenu";
