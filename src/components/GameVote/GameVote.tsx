import { observer } from "mobx-react-lite";
import styles from "./GameVote.module.scss";
import { rootStore } from "@/store/rootStore.ts";

export const GameVote = observer(() => {
  const { gamesStore, usersStore } = rootStore;
  const { gameFlow } = gamesStore;
  const { getUserName } = usersStore;

  return (
    <div className={styles.container}>
      <p>Vote list</p>
      <div className={styles.listContainer}>
        <ul className={styles.list}>
          {gameFlow.proposed.map((userId) => (
            <div key={userId}>
              <p>{getUserName(userId)}</p>
            </div>
          ))}
        </ul>
      </div>
    </div>
  );
});
