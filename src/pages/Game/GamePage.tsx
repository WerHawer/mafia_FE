import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { useAddUserToGameMutation } from "@/api/game/queries.ts";
import { useGetUsersWithAddToStore } from "@/api/user/queries.ts";
import { GameChat } from "@/components/GameChat";
import { GameInfoSection } from "@/components/GameInfoSection";
import { GameVideoContainer } from "@/components/GameVideoContainer";
import { GameVote } from "@/components/GameVote";
import { LiveKitMafiaRoom } from "@/components/LiveKitMafiaRoom/LiveKitMafiaRoom.tsx";
import { VideoConfig } from "@/components/VideoConfig";
import { rootStore } from "@/store/rootStore.ts";

import styles from "./GamePage.module.scss";

const GamePage = observer(() => {
  const { id = "" } = useParams();
  const { usersStore, gamesStore } = rootStore;
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
      <LiveKitMafiaRoom>
        <VideoConfig />

        <GameVideoContainer />
      </LiveKitMafiaRoom>

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
