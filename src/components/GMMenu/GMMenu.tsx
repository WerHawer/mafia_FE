import {
  AudioMutedOutlined,
  AudioOutlined,
  CrownOutlined,
  LogoutOutlined,
  MoreOutlined,
  VideoCameraAddOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { updateGameGM } from "@/api/game/api.ts";
import { useBatchMediaControls } from "@/hooks/useBatchMediaControls.ts";
import { useMockStreams } from "@/hooks/useMockStreams.ts";
import { routes } from "@/router/routs.ts";
import { rootStore } from "@/store/rootStore.ts";
import {
  Dropdown,
  IconButton,
  Menu,
  MenuItem,
  MenuItemVariant,
  MenuSeparator,
} from "@/UI";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";

import styles from "./GMMenu.module.scss";

export const GMMenu = observer(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { gamesStore, usersStore, isIGM } = rootStore;
  const { activeGameId, activeGamePlayers, activeGameGm } = gamesStore;
  const { myId } = usersStore;

  const { unmuteAll, muteAllExceptGM } = useBatchMediaControls({
    roomId: activeGameId || "",
    requesterId: myId,
    allUserIds: activeGamePlayers,
  });

  const { mockStreamsEnabled, handleToggleMockStreams } = useMockStreams();

  const handleMakeMeGM = useCallback(async () => {
    if (!activeGameId || !myId) return;

    try {
      await updateGameGM({
        gameId: activeGameId,
        userId: myId,
      });
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Failed to set you as GM:", error);
    }
  }, [activeGameId, myId]);

  const handleToggleMockStreamsClick = useCallback(() => {
    handleToggleMockStreams();
    setIsMenuOpen(false);
  }, [handleToggleMockStreams]);

  const handleMuteAll = useCallback(() => {
    muteAllExceptGM(activeGameGm);
    setIsMenuOpen(false);
  }, [activeGameGm, muteAllExceptGM]);

  const handleUnmuteAll = useCallback(() => {
    unmuteAll();
    setIsMenuOpen(false);
  }, [unmuteAll]);

  const handleLeaveGame = useCallback(() => {
    setIsMenuOpen(false);
    navigate(routes.home);
  }, [navigate]);

  return (
    <div className={styles.gmMenuContainer}>
      <Dropdown
        trigger={
          <IconButton
            icon={<MoreOutlined />}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Medium}
            active={isMenuOpen}
            ariaLabel={t("gmMenu.title")}
          />
        }
        content={
          <Menu>
            {!isIGM && (
              <MenuItem
                icon={<CrownOutlined />}
                label={t("gmMenu.makeMeGM")}
                onClick={handleMakeMeGM}
              />
            )}

            {isIGM && (
              <>
                <MenuItem
                  icon={
                    mockStreamsEnabled ? (
                      <VideoCameraOutlined />
                    ) : (
                      <VideoCameraAddOutlined />
                    )
                  }
                  label={
                    mockStreamsEnabled
                      ? t("gmMenu.disableMockStreams")
                      : t("gmMenu.enableMockStreams")
                  }
                  onClick={handleToggleMockStreamsClick}
                />

                <MenuSeparator />

                <MenuItem
                  icon={<AudioMutedOutlined />}
                  label={t("gmMenu.muteAll")}
                  onClick={handleMuteAll}
                />

                <MenuItem
                  icon={<AudioOutlined />}
                  label={t("gmMenu.unmuteAll")}
                  onClick={handleUnmuteAll}
                />

                <MenuSeparator />
              </>
            )}

            <MenuItem
              icon={<LogoutOutlined />}
              label={t("gmMenu.leaveGame")}
              onClick={handleLeaveGame}
            />
          </Menu>
        }
        isOpen={isMenuOpen}
        onToggle={setIsMenuOpen}
        placement="bottom-end"
      />
    </div>
  );
});

GMMenu.displayName = "GMMenu";
