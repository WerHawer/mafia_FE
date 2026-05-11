import {
  AudioMutedOutlined,
  AudioOutlined,
  CheckCircleOutlined,
  ExperimentOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  LogoutOutlined,
  MoreOutlined,
  ReloadOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import Tippy from "@tippyjs/react";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { ModalNames } from "@/components/Modals/Modal.types.ts";
import { useGMMenu } from "@/hooks/useGMMenu.ts";
import { modalStore } from "@/store/modalStore.ts";
import { Dropdown, Menu, MenuItem, MenuSeparator } from "@/UI";

import styles from "./GMMenu.module.scss";

const TEST_USER_PRESETS = [3, 5, 7, 9, 11] as const;

export const GMMenu = observer(() => {
  const { t } = useTranslation();
  const { openModal } = modalStore;
  const {
    isMenuOpen,
    setIsMenuOpen,
    isIGM,
    gameFlow,
    onMuteAll,
    onUnmuteAll,
    onDisableAllCameras,
    onEnableAllCameras,
    onRestartGame,
    onFinishGame,
    onLeaveGame,
    // TODO: remove — temporary for layout stress-testing
    onAddTestUsers,
    isAddingTestUsers,
  } = useGMMenu();

  return (
    <div className={styles.gmMenuContainer}>
      <Dropdown
        trigger={
          <Tippy
            content={t("gmMenu.title")}
            delay={[500, 0]}
            theme="role-tooltip"
          >
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
                      label={t("game.settings")}
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

                    <MenuItem
                      icon={<CheckCircleOutlined />}
                      label={t("gmMenu.finishGame")}
                      onClick={onFinishGame}
                    />
                  </>
                )}

                <MenuSeparator />
              </>
            )}

            {/* TODO: remove — temporary layout stress test */}
            <div className={styles.testUsersSection}>
              <span className={styles.testUsersLabel}>
                <ExperimentOutlined />
                {isAddingTestUsers
                  ? t("gmMenu.addTestUsersLoading")
                  : t("gmMenu.addTestUsers")}
              </span>
              <div className={styles.testUsersCountRow}>
                {TEST_USER_PRESETS.map((count) => (
                  <button
                    key={count}
                    className={styles.testUsersCountBtn}
                    onClick={() => {
                      onAddTestUsers(count);
                      setIsMenuOpen(false);
                    }}
                    disabled={isAddingTestUsers}
                    aria-label={`Add ${count} test players`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <MenuSeparator />

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
