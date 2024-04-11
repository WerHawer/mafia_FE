import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useParams } from "react-router-dom";
import classNames from "classnames";
import { GameVideoContainer } from "../../components/GameVideoContainer";
import { GameChat } from "../../components/GameChat";
import { useAddUserToGameMutation } from "../../api/game/queries.ts";
import { GameInfoSection } from "../../components/GameInfoSection";
import { usersStore } from "../../store/usersStore.ts";
import { gamesStore } from "../../store/gamesStore.ts";
import styles from "./GamePage.module.scss";
import { useGetUsersWithAddToStore } from "../../api/user/queries.ts";

const GamePage = observer(() => {
  const { id = "" } = useParams();
  const { myId } = usersStore;
  const { setActiveGame, activeGamePlayers } = gamesStore;
  const { mutate: addUserToGame } = useAddUserToGameMutation();
  useGetUsersWithAddToStore(activeGamePlayers);

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
    }, 100);

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
          vote
        </section>
        <section className={styles.chatSection}>
          <GameChat />
        </section>
      </aside>
    </div>
  );
});

export default GamePage;
