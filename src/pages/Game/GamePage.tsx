import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useParams } from "react-router-dom";
import classNames from "classnames";
import { GameVideoContainer } from "@/components/GameVideoContainer";
import { GameChat } from "@/components/GameChat";
import { useAddUserToGameMutation } from "@/api/game/queries.ts";
import { GameInfoSection } from "@/components/GameInfoSection";
import styles from "./GamePage.module.scss";
import { useGetUsersWithAddToStore } from "@/api/user/queries.ts";
import { GameVote } from "@/components/GameVote";
import { useStreams } from "@/hooks/useStreams.ts";
import { rootStore } from "@/store/rootStore.ts";

const GamePage = observer(() => {
  const { id = "" } = useParams();
  const { usersStore, gamesStore, streamsStore } = rootStore;
  const { myId } = usersStore;
  const { setActiveGame, activeGamePlayers } = gamesStore;
  const { myStream } = streamsStore;
  const { mutate: addUserToGame } = useAddUserToGameMutation();
  useGetUsersWithAddToStore(activeGamePlayers);
  useStreams({ myStream, myId });

  useEffect(() => {
    if (!id) return;

    setActiveGame(id);
  }, [id, setActiveGame]);

  useEffect(() => {
    if (!myId || !id) return;

    // hack to prevent double request
    const requestTimer = setTimeout(() => {
      addUserToGame({
        userId: myId,
        gameId: id,
      });
    }, 0);

    return () => clearTimeout(requestTimer);
  }, [id, addUserToGame, myId]);

  return (
    <div className={styles.pageContainer}>
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
