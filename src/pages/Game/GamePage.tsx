import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import {
  useAddUserToGameMutation,
  useFetchGameWithStore,
  useRemoveUserFromGameMutation,
} from "@/api/game/queries.ts";
import { useGetUsersWithAddToStore } from "@/api/user/queries.ts";
import { GameChat } from "@/components/GameChat";
import { GameInfoSection } from "@/components/GameInfoSection";
import { FloatingReactions, GameBottomBar } from "@/components/GameReactions";
import { GameVideoManager } from "@/components/GameVideoManager/GameVideoManager.tsx";
import { GameVote } from "@/components/GameVote";
import { LiveKitMafiaRoom } from "@/components/LiveKitMafiaRoom/LiveKitMafiaRoom.tsx";
import { AudioProvider } from "@/components/AudioProvider/AudioProvider.tsx";
import { useAdaptiveQuality } from "@/hooks/useAdaptiveQuality.ts";
import { useSelectedDevices } from "@/hooks/useSelectedDevices.ts";
import { useUserMediaStream } from "@/hooks/useUserMediaStream.ts";
import { useVideoSettings } from "@/hooks/useVideoSettings.ts";
import { routes } from "@/router/routs.ts";
import { rootStore } from "@/store/rootStore.ts";
import { Roles } from "@/types/game.types.ts";

import brokenGlassIcon from "@/assets/icons/broken_glass.png";
import kissMarkIcon from "@/assets/icons/kiss_mark.png";

import styles from "./GamePage.module.scss";

// Preload required SVG/PNG assets so they display instantly upon game action
const PRELOAD_ASSETS = [
  brokenGlassIcon,
  kissMarkIcon,
  "/aim.svg",
  "/kiss.svg",
  "/syringe.svg",
  "/question.svg",
];

const GamePage = observer(() => {
  const { id = "" } = useParams();
  const { usersStore, gamesStore } = rootStore;
  const { myId } = usersStore;
  const { activeGamePlayers, removeActiveGame, updateGame, gameFlow } = gamesStore;
  const { isIGM } = rootStore;

  // Fetch full game data to check if it's started before joining
  const { game: fetchedGame } = useFetchGameWithStore(id);

  // Redirect if game is already started and this user has no role/is not a player
  const isStarted = fetchedGame?.gameFlow?.isStarted;
  const allRolePlayers: string[] = fetchedGame
    ? [
        ...(fetchedGame.players ?? []),
        ...(fetchedGame.mafia ?? []),
        ...(fetchedGame.sheriff ? [fetchedGame.sheriff] : []),
        ...(fetchedGame.doctor ? [fetchedGame.doctor] : []),
        ...(fetchedGame.prostitute ? [fetchedGame.prostitute] : []),
        ...(fetchedGame.don ? [fetchedGame.don] : []),
        fetchedGame[Roles.GM],
      ].filter(Boolean)
    : [];
  const isAllowedIn = !myId || !isStarted || allRolePlayers.includes(myId);

  const proposedCount = gameFlow.proposed.length;
  const { mutate: addUserToGame } = useAddUserToGameMutation();
  const { mutate: removeUserFromGame } = useRemoveUserFromGameMutation();
  const [isJoinedToGame, setIsJoinedToGame] = useState(false);
  const [shouldShowVideoConfig, setShouldShowVideoConfig] = useState(false);
  const [shouldShowAudioConfig, setShouldShowAudioConfig] = useState(false);

  const {
    videoDeviceId,
    audioInputDeviceId,
    audioOutputDeviceId,
    setVideoDevice,
    setAudioInputDevice,
    setAudioOutputDevice,
  } = useSelectedDevices();

  const quality = useAdaptiveQuality();

  const originalStream = useUserMediaStream({
    audio: true,
    video: {
      width: { ideal: quality.settings.width },
      height: { ideal: quality.settings.height },
      frameRate: { ideal: quality.settings.fps },
      ...(videoDeviceId ? { deviceId: { exact: videoDeviceId } } : {}),
    },
  });

  // Once we have the stream, verify the camera actually delivered the requested quality
  useEffect(() => {
    if (originalStream) quality.onStreamReady(originalStream);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalStream]);

  const { getSavedSettings } = useVideoSettings(id);

  // Preload visual effect images exactly once when page loads
  useEffect(() => {
    PRELOAD_ASSETS.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useGetUsersWithAddToStore(activeGamePlayers);

  const firstStreamRef = useRef(false);

  useEffect(() => {
    if (!originalStream || firstStreamRef.current) return;

    firstStreamRef.current = true;

    const savedSettings = getSavedSettings();

    if (!savedSettings) {
      setShouldShowVideoConfig(true);
    }
  }, [originalStream, getSavedSettings]);

  useEffect(() => {
    if (!myId || !id) return;

    addUserToGame(
      {
        userId: myId,
        gameId: id,
      },
      {
        onSuccess: ({ data: game }) => {
          updateGame(game);
          setIsJoinedToGame(true);
        },
        onError: () => {
          setIsJoinedToGame(false);
        },
      }
    );

    return () => {
      setIsJoinedToGame(false);
      removeActiveGame();
      removeUserFromGame({
        userId: myId,
        gameId: id,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, myId]);

  // Redirect strangers who navigate directly to a started game
  if (fetchedGame && !isAllowedIn) {
    return <Navigate to={routes.home} replace />;
  }

  return (
    <AudioProvider>
      <div className={styles.pageContainer}>
        <FloatingReactions />

        <LiveKitMafiaRoom enabled={isJoinedToGame}>
          <div className={styles.videoSection}>
            <div className={styles.videoGridWrapper}>
              <GameVideoManager
                originalStream={originalStream}
                gameId={id}
                quality={quality}
                showVideoConfig={shouldShowVideoConfig}
                onCloseVideoConfig={() => setShouldShowVideoConfig(false)}
                showAudioConfig={shouldShowAudioConfig}
                onCloseAudioConfig={() => setShouldShowAudioConfig(false)}
              />
            </div>

            <GameBottomBar
              isJoinedToGame={isJoinedToGame}
              videoDeviceId={videoDeviceId}
              audioInputDeviceId={audioInputDeviceId}
              audioOutputDeviceId={audioOutputDeviceId}
              onSelectVideoDevice={setVideoDevice}
              onSelectAudioInputDevice={setAudioInputDevice}
              onSelectAudioOutputDevice={setAudioOutputDevice}
              onOpenVideoConfig={() => setShouldShowVideoConfig(true)}
              onOpenAudioConfig={() => setShouldShowAudioConfig(true)}
            />
          </div>
        </LiveKitMafiaRoom>

        <aside className={styles.rightContainer}>
          {/* personalInfo: always for GM, for players only when no vote active */}
          {(isIGM || proposedCount === 0) && (
            <section
              className={classNames(styles.asideSection, styles.personalInfo)}
            >
              <GameInfoSection />
            </section>
          )}

          {/* Vote panel: inline in flow, replaces personalInfo for players */}
          <GameVote />

          <section className={styles.chatSection}>
            <GameChat />
          </section>
        </aside>
      </div>
    </AudioProvider>
  );
});

GamePage.displayName = "GamePage";

export default GamePage;
