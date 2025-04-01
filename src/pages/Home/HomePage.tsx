import { GamesList } from "@/components/GamesList";
import { PublicChat } from "@/components/PublicChat/PublicChat.tsx";

import styles from "./HomePage.module.scss";

const HomePage = () => {
  return (
    <div className={styles.container}>
      <GamesList />
      <PublicChat />
    </div>
  );
};

HomePage.displayName = "HomePage";

export default HomePage;
