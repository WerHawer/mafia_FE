import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { Navigate, useParams } from "react-router-dom";

import { useGetUsersWithAddToStore } from "@/api/user/queries.ts";
import { AudioProvider } from "@/components/AudioProvider/AudioProvider.tsx";
import { GameChat } from "@/components/GameChat";
import { GameInfoSection } from "@/components/GameInfoSection";
import { FloatingReactions, GameBottomBar } from "@/components/GameReactions";
import { GameVideoManager } from "@/components/GameVideoManager/GameVideoManager.tsx";
import { GameVote } from "@/components/GameVote";
import { LiveKitMafiaRoom } from "@/components/LiveKitMafiaRoom/LiveKitMafiaRoom.tsx";
import { routes } from "@/router/routs.ts";
import { rootStore } from "@/store/rootStore.ts";

import styles from "./GamePage.module.scss";
import { useGameAccess } from "./hooks/useGameAccess.ts";
import { useGameMediaSetup } from "./hooks/useGameMediaSetup.ts";
import { useGameSession } from "./hooks/useGameSession.ts";
import { useSocketContext } from "@/context/SocketProvider.tsx";
import { modalStore } from "@/store/modalStore.ts";
import { ModalNames } from "@/components/Modals/Modal.types.ts";
import { useEffect } from "react";
import { wsEvents } from "@/config/wsEvents.ts";

const GamePage = observer(() => {
  const { id = "" } = useParams();
  const { gamesStore } = rootStore;
  const { activeGamePlayers, gameFlow } = gamesStore;
  const { isIGM } = rootStore;

  const proposedCount = gameFlow.proposed.length;

  const { fetchedGame, isLoading, isAllowedIn, isNotFound, isInactive } =
    useGameAccess(id);
  const { isJoinedToGame } = useGameSession(id);
  const {
    originalStream,
    quality,
    videoDeviceId,
    audioInputDeviceId,
    audioOutputDeviceId,
    setVideoDevice,
    setAudioInputDevice,
    setAudioOutputDevice,
    shouldShowVideoConfig,
    setShouldShowVideoConfig,
    shouldShowAudioConfig,
    setShouldShowAudioConfig,
  } = useGameMediaSetup(id);

  useGetUsersWithAddToStore(activeGamePlayers);

  const { socket } = useSocketContext();
  const myId = rootStore.usersStore.myId;
  const isKilled = gamesStore.activeGameKilledPlayers.includes(myId || "");
  const isMeObserver = gamesStore.isMeObserver;

  useEffect(() => {
    if (isKilled && !isMeObserver && !modalStore.isModalOpen) {
      modalStore.openModal(ModalNames.GhostModeModal, {
        onConfirm: () => {
          if (socket && id && myId) {
            socket.emit(wsEvents.setObserverMode, { gameId: id, userId: myId });
          }
        },
      });
    }
  }, [isKilled, isMeObserver, socket, id, myId]);

  // Wait for the query to resolve before making any redirect decision
  if (isLoading) return null;

  // Redirect if the game link is invalid (not found on server)
  if (isNotFound) return <Navigate to={routes.home} replace />;

  // Redirect if the game is finished / no longer active
  if (isInactive) return <Navigate to={routes.home} replace />;

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
