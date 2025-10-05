import { useFetchActiveGamesWithStore } from "@/api/game/queries.ts";
import { GamesList } from "@/components/GamesList";
import { PublicChat } from "@/components/PublicChat/PublicChat.tsx";

import styles from "./HomePage.module.scss";

const HomePage = () => {
  useFetchActiveGamesWithStore();

  return (
    <div className={styles.container}>
      <GamesList />
      <PublicChat />
    </div>
  );
};

HomePage.displayName = "HomePage";

export default HomePage;
