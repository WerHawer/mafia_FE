import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  useAddUserToGameMutation,
  useRemoveUserFromGameMutation,
} from "@/api/game/queries.ts";
import { useGetUsersWithAddToStore } from "@/api/user/queries.ts";
import { GameChat } from "@/components/GameChat";
import { GameInfoSection } from "@/components/GameInfoSection";
import { GameVideoManager } from "@/components/GameVideoManager/GameVideoManager.tsx";
import { GameVote } from "@/components/GameVote";
import { GMMenu } from "@/components/GMMenu";
import { LiveKitMafiaRoom } from "@/components/LiveKitMafiaRoom/LiveKitMafiaRoom.tsx";
import { videoOptions } from "@/config/video.ts";
import { useUserMediaStream } from "@/hooks/useUserMediaStream.ts";
import { useVideoSettings } from "@/hooks/useVideoSettings.ts";
import { rootStore } from "@/store/rootStore.ts";

import styles from "./GamePage.module.scss";

const GamePage = observer(() => {
  const { id = "" } = useParams();
  const { usersStore, gamesStore } = rootStore;
  const { myId } = usersStore;
  const { activeGamePlayers, removeActiveGame, updateGame } = gamesStore;
  const { mutate: addUserToGame } = useAddUserToGameMutation();
  const { mutate: removeUserFromGame } = useRemoveUserFromGameMutation();
  const [shouldShowVideoConfig, setShouldShowVideoConfig] = useState(false);

  const originalStream = useUserMediaStream({
    audio: false,
    video: videoOptions,
  });

  const { getSavedSettings } = useVideoSettings(id);

  useGetUsersWithAddToStore(activeGamePlayers);

  useEffect(() => {
    if (!originalStream) return;

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
        },
      }
    );

    return () => {
      removeActiveGame();
      removeUserFromGame({
        userId: myId,
        gameId: id,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, myId]);

  return (
    <div className={styles.pageContainer}>
      <LiveKitMafiaRoom>
        <GMMenu onOpenVideoConfig={() => setShouldShowVideoConfig(true)} />

        <GameVideoManager
          originalStream={originalStream}
          gameId={id}
          showVideoConfig={shouldShowVideoConfig}
          onCloseVideoConfig={() => setShouldShowVideoConfig(false)}
        />
      </LiveKitMafiaRoom>

      <aside className={styles.rightContainer}>
        <section
          className={classNames(styles.asideSection, styles.personalInfo)}
        >
          <GameInfoSection />
        </section>

        <section className={styles.chatSection}>
          <GameChat />
        </section>
      </aside>

      <GameVote />
    </div>
  );
});

GamePage.displayName = "GamePage";

export default GamePage;
