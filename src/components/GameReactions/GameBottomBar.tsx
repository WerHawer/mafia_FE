import { LogoutOutlined } from "@ant-design/icons";
import Tippy from "@tippyjs/react";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { GMMenu } from "@/components/GMMenu";
import { useGameReactions } from "@/hooks/useGameReactions.ts";
import { useMockStreams } from "@/hooks/useMockStreams.ts";
import { routes } from "@/router/routs.ts";
import { rootStore } from "@/store/rootStore.ts";

import { GameReactionsBar } from "./GameReactionsBar";
import { SelfMediaControlsBar } from "./SelfMediaControlsBar";
import styles from "./GameBottomBar.module.scss";

type GameBottomBarProps = {
  isJoinedToGame: boolean;
  videoDeviceId: string;
  audioInputDeviceId: string;
  audioOutputDeviceId: string;
  onSelectVideoDevice: (id: string) => void;
  onSelectAudioInputDevice: (id: string) => void;
  onSelectAudioOutputDevice: (id: string) => void;
  onOpenVideoConfig: () => void;
  onOpenAudioConfig: () => void;
};

export const GameBottomBar = observer(
  ({
    isJoinedToGame,
    videoDeviceId,
    audioInputDeviceId,
    audioOutputDeviceId,
    onSelectVideoDevice,
    onSelectAudioInputDevice,
    onSelectAudioOutputDevice,
    onOpenVideoConfig,
    onOpenAudioConfig,
  }: GameBottomBarProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isIGM } = rootStore;
    const { sendReaction } = useGameReactions();
    const { allTracks } = useMockStreams();

    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      if (isJoinedToGame && allTracks.length > 0) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    }, [isJoinedToGame, allTracks.length]);

    return (
      <div className={classNames(styles.bottomBar, { [styles.bottomBarVisible]: isVisible })}>
        <SelfMediaControlsBar
          videoDeviceId={videoDeviceId}
          audioInputDeviceId={audioInputDeviceId}
          audioOutputDeviceId={audioOutputDeviceId}
          onSelectVideoDevice={onSelectVideoDevice}
          onSelectAudioInputDevice={onSelectAudioInputDevice}
          onSelectAudioOutputDevice={onSelectAudioOutputDevice}
          onOpenVideoConfig={onOpenVideoConfig}
          onOpenAudioConfig={onOpenAudioConfig}
        />

        <div className={styles.divider} />

        <GameReactionsBar sendReaction={sendReaction} />

        <div className={styles.divider} />

        {isIGM ? (
          <GMMenu
            onOpenVideoConfig={onOpenVideoConfig}
            onOpenAudioConfig={onOpenAudioConfig}
          />
        ) : (
          <Tippy content={t("gmMenu.leaveGame")} delay={[500, 0]} theme="role-tooltip">
            <button
              className={classNames(styles.controlBtn, styles.danger)}
              onClick={() => navigate(routes.home)}
              aria-label={t("gmMenu.leaveGame")}
            >
              <LogoutOutlined />
            </button>
          </Tippy>
        )}
      </div>
    );
  }
);

GameBottomBar.displayName = "GameBottomBar";
