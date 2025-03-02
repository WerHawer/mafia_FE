import { useAddUserToGameMutation } from "@/api/game/queries.ts";
import { useGetUsersWithAddToStore } from "@/api/user/queries.ts";
import { GameChat } from "@/components/GameChat";
import { GameInfoSection } from "@/components/GameInfoSection";
import { GameVideoContainer } from "@/components/GameVideoContainer";
import { GameVote } from "@/components/GameVote";
import { VideoConfig } from "@/components/VideoConfig";
import { videoOptions } from "@/config/video.ts";
import { useStreams } from "@/hooks/useStreams.ts";
import { useUserMediaStream } from "@/hooks/useUserMediaStream.ts";
import { rootStore } from "@/store/rootStore.ts";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import styles from "./GamePage.module.scss";

const GamePage = observer(() => {
  const { id = "" } = useParams();
  const { usersStore, gamesStore, streamsStore } = rootStore;
  const { myId } = usersStore;
  const { setActiveGame, activeGamePlayers } = gamesStore;
  const { myStream } = streamsStore;
  const { mutate: addUserToGame } = useAddUserToGameMutation();

  useGetUsersWithAddToStore(activeGamePlayers);
  useStreams({ myStream, myId });

  useUserMediaStream({
    audio: true,
    video: videoOptions,
  });

  useEffect(() => {
    if (!id) return;

    setActiveGame(id);
  }, [id, setActiveGame]);

  useEffect(() => {
    if (!myId || !id || !myStream) return;

    // hack to prevent double request
    const requestTimer = setTimeout(() => {
      addUserToGame({
        userId: myId,
        gameId: id,
      });
    }, 0);

    return () => clearTimeout(requestTimer);
  }, [id, addUserToGame, myId, myStream]);

  return (
    <div className={styles.pageContainer}>
      <VideoConfig />

      <GameVideoContainer />

      <aside className={styles.rightContainer}>
        <section
          className={classNames(styles.asideSection, styles.personalInfo)}
        >
          <GameInfoSection />
        </section>

        <section className={classNames(styles.asideSection, styles.voteList)}>
          <GameVote />
        </section>

        <section className={styles.chatSection}>
          <GameChat />
        </section>
      </aside>
    </div>
  );
});

GamePage.displayName = "GamePage";

export default GamePage;
