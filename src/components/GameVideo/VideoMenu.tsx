import { MoreOutlined } from "@ant-design/icons";
// @ts-ignore
import { Instance } from "@tippyjs/react";
import { observer } from "mobx-react-lite";
import { useRef } from "react";
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

export const VideoMenu = observer(
  ({ userId, isCurrentUserGM }: VideoMenuProps) => {
    const { t } = useTranslation();
    const tippyInstanceRef = useRef<Instance | null>(null);
    const { mutate: updateGM } = useUpdateGameGMMutation();
    const { mutate: updateGameFlow } = useUpdateGameFlowMutation();
    const { gamesStore } = rootStore;
    const { activeGameId, gameFlow } = gamesStore;

    const onUpdateGM = () => {
      if (!userId || !activeGameId) return;
      if (isCurrentUserGM) return;

      updateGM({ gameId: activeGameId, userId });
      tippyInstanceRef.current?.hide();
    };

    const onKill = (killed: string[]) => {
      if (!userId) return;

      updateGameFlow({
        speaker: "",
        isExtraSpeech: false,
        killed: [...killed, userId],
      });
      tippyInstanceRef.current?.hide();
    };

    const onGiveSpeak = () => {
      if (!userId) return;

      updateGameFlow({
        speaker: userId,
      });
      tippyInstanceRef.current?.hide();
    };

    return (
      <PopupMenu
        className={styles.videoMenu}
        hideOnClick
        onCreate={(instance) => (tippyInstanceRef.current = instance)}
        content={
          <>
            <PopupMenuElement onClick={onUpdateGM}>
              {t("videoMenu.doGM")}
            </PopupMenuElement>

            <PopupMenuElement onClick={() => onKill(gameFlow.killed)}>
              {t("videoMenu.kill")}
            </PopupMenuElement>

            <PopupMenuElement onClick={onGiveSpeak}>
              {t("videoMenu.giveSpeak")}
            </PopupMenuElement>
          </>
        }
      >
        <MoreOutlined className={styles.menu} />
      </PopupMenu>
    );
  }
);

VideoMenu.displayName = "VideoMenu";
