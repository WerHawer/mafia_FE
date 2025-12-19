import {
  CrownOutlined,
  MoreOutlined,
  SoundOutlined,
  UserDeleteOutlined,
} from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  useUpdateGameFlowMutation,
  useUpdateGameGMMutation,
} from "@/api/game/queries.ts";
import { useBatchMediaControls } from "@/hooks/useBatchMediaControls.ts";
import { rootStore } from "@/store/rootStore.ts";
import { UserId } from "@/types/user.types.ts";
import {
  Dropdown,
  IconButton,
  Menu,
  MenuItem,
  MenuItemVariant,
  MenuSeparator,
} from "@/UI";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";

import styles from "./GameVideo.module.scss";

type VideoMenuProps = {
  userId?: UserId;
  isCurrentUserGM: boolean;
};

export const VideoMenu = observer(
  ({ userId, isCurrentUserGM }: VideoMenuProps) => {
    const { t } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { mutate: updateGM } = useUpdateGameGMMutation();
    const { mutate: updateGameFlow } = useUpdateGameFlowMutation();
    const { gamesStore } = rootStore;
    const { activeGameId, gameFlow } = gamesStore;
    const { unmuteSpeaker, muteSpeaker } = useBatchMediaControls();

    const onUpdateGM = () => {
      if (!userId || !activeGameId) return;
      if (isCurrentUserGM) return;

      updateGM({ gameId: activeGameId, userId });
      setIsMenuOpen(false);
    };

    const onKill = (killed: string[]) => {
      if (!userId) return;

      updateGameFlow({
        speaker: "",
        isExtraSpeech: false,
        killed: [...killed, userId],
      });
      setIsMenuOpen(false);
    };

    const onGiveSpeak = () => {
      if (!userId) return;

      const previousSpeaker = gameFlow.speaker;

      updateGameFlow(
        {
          speaker: userId,
        },
        {
          onSuccess: () => {
            if (previousSpeaker) {
              muteSpeaker(previousSpeaker);
            }

            unmuteSpeaker(userId);
          },
        }
      );
      setIsMenuOpen(false);
    };

    return (
      <div className={styles.menuContainer}>
        <Dropdown
          trigger={
            <IconButton
              icon={<MoreOutlined />}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              variant={ButtonVariant.Tertiary}
              size={ButtonSize.Small}
              active={isMenuOpen}
              ariaLabel={t("videoMenu.title")}
            />
          }
          content={
            <Menu>
              <MenuItem
                icon={<CrownOutlined />}
                label={t("videoMenu.doGM")}
                onClick={onUpdateGM}
                disabled={isCurrentUserGM}
              />

              <MenuItem
                icon={<SoundOutlined />}
                label={t("videoMenu.giveSpeak")}
                onClick={onGiveSpeak}
              />

              <MenuSeparator />

              <MenuItem
                icon={<UserDeleteOutlined />}
                label={t("videoMenu.kill")}
                onClick={() => onKill(gameFlow.killed)}
              />
            </Menu>
          }
          isOpen={isMenuOpen}
          onToggle={setIsMenuOpen}
          placement="bottom-end"
        />
      </div>
    );
  }
);

VideoMenu.displayName = "VideoMenu";
