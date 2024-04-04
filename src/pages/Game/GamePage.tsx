import styles from "./GamePage.module.scss";
import classNames from "classnames";
import { GameVideoContainer } from "../../components/GameVideoContainer";
import { GameChat } from "../../components/GameChat";
import { useParams } from "react-router-dom";
import { useAddUserToGameMutation } from "../../api/game/queries.ts";
import { GameInfoSection } from "../../components/GameInfoSection";
import { usersStore } from "../../store/usersStore.ts";
import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useUpdateGameSubs } from "../../hooks/useUpdateGameSubs.ts";

const GamePage = observer(() => {
  const { id = "" } = useParams();
  const { myId } = usersStore;
  const { mutate } = useAddUserToGameMutation();
  useUpdateGameSubs();

  useEffect(() => {
    if (!myId || !id) return;

    // hack to prevent double request
    const requestTimer = setTimeout(() => {
      mutate({
        userId: myId,
        gameId: id,
      });
    }, 100);

    return () => clearTimeout(requestTimer);
  }, [id, mutate, myId]);

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
