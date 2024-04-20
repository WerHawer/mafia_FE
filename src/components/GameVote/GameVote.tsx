import { observer } from "mobx-react-lite";
import { gamesStore } from "@/store/gamesStore.ts";
import { usersStore } from "@/store/usersStore.ts";
import styles from "./GameVote.module.scss";

export const GameVote = observer(() => {
  const { gameFlow } = gamesStore;
  const { getUser } = usersStore;

  return (
    <div className={styles.container}>
      <p>Vote list</p>
      <div className={styles.listContainer}>
        <ul className={styles.list}>
          {gameFlow.proposed.map((userId) => (
            <div key={userId}>
              <p>{getUser(userId)?.name}</p>
            </div>
          ))}
        </ul>
      </div>
    </div>
  );
});
