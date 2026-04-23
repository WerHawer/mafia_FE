import {
  AudioMutedOutlined,
  AudioOutlined,
  CrownOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  LogoutOutlined,
  MoreOutlined,
  ReloadOutlined,
  SettingOutlined,
  SoundOutlined,
  VideoCameraAddOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import Tippy from "@tippyjs/react";
import { useTranslation } from "react-i18next";

import { useGMMenu } from "@/hooks/useGMMenu.ts";
import { ModalNames } from "@/components/Modals/Modal.types.ts";
import { modalStore } from "@/store/modalStore.ts";
import { Dropdown, Menu, MenuItem, MenuSeparator } from "@/UI";

import styles from "./GMMenu.module.scss";

export const GMMenu = observer(() => {
  const { t } = useTranslation();
  const { openModal } = modalStore;
  const {
    isMenuOpen,
    setIsMenuOpen,
    isIGM,
    gameFlow,
    onMakeMeGM,
    onMuteAll,
    onUnmuteAll,
    onDisableAllCameras,
    onEnableAllCameras,
    onRestartGame,
    onLeaveGame,
  } = useGMMenu();

  return (
    <div className={styles.gmMenuContainer}>
      <Dropdown
        trigger={
          <Tippy content={t("gmMenu.title")} delay={[500, 0]} theme="role-tooltip">
            <button
              className={classNames(styles.controlBtn, {
                [styles.active]: isMenuOpen,
              })}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={t("gmMenu.title")}
            >
              <MoreOutlined />
            </button>
          </Tippy>
        }
        content={
          <Menu>
            {/*{!isIGM && (*/}
            {/*  <MenuItem*/}
            {/*    icon={<CrownOutlined />}*/}
            {/*    label={t("gmMenu.makeMeGM")}*/}
            {/*    onClick={onMakeMeGM}*/}
            {/*  />*/}
            {/*)}*/}

            {isIGM && (
              <>
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

                <MenuItem
                  icon={<EyeInvisibleOutlined />}
                  label={t("gmMenu.disableAllCameras")}
                  onClick={onDisableAllCameras}
                />

                <MenuItem
                  icon={<EyeOutlined />}
                  label={t("gmMenu.enableAllCameras")}
                  onClick={onEnableAllCameras}
                />

                {!gameFlow.isStarted && (
                  <>
                    <MenuSeparator />
                    <MenuItem
                      icon={<SettingOutlined />}
                      label={t("game.settings", "Налаштування гри")}
                      onClick={() => {
                        setIsMenuOpen(false);
                        openModal(ModalNames.GameSettingsModal, {});
                      }}
                    />
                  </>
                )}

                {gameFlow.isStarted && (
                  <>
                    <MenuSeparator />

                    <MenuItem
                      icon={<ReloadOutlined />}
                      label={t("gmMenu.restartGame")}
                      onClick={onRestartGame}
                    />
                  </>
                )}

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
