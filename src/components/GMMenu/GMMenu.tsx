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
import { useTranslation } from "react-i18next";

import { useGMMenu } from "@/hooks/useGMMenu.ts";
import { Dropdown, IconButton, Menu, MenuItem, MenuSeparator } from "@/UI";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";

import styles from "./GMMenu.module.scss";

export const GMMenu = observer(() => {
  const { t } = useTranslation();
  const {
    isMenuOpen,
    setIsMenuOpen,
    isIGM,
    mockStreamsEnabled,
    onMakeMeGM,
    onToggleMockStreams,
    onMuteAll,
    onUnmuteAll,
    onLeaveGame,
  } = useGMMenu();

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
                onClick={onMakeMeGM}
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
                  onClick={onToggleMockStreams}
                />

                <MenuSeparator />

                <MenuItem
                  icon={<AudioMutedOutlined />}
                  label={t("gmMenu.muteAll")}
                  onClick={onMuteAll}
                />

                <MenuItem
                  icon={<AudioOutlined />}
                  label={t("gmMenu.unmuteAll")}
                  onClick={onUnmuteAll}
                />

                <MenuSeparator />
              </>
            )}

            <MenuItem
              icon={<LogoutOutlined />}
              label={t("gmMenu.leaveGame")}
              onClick={onLeaveGame}
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
