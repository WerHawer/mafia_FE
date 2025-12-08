import { observer } from "mobx-react-lite";
import { useCallback, useState } from "react";

import { rootStore } from "@/store/rootStore.ts";

import styles from "./GameVote.module.scss";

export const GameVote = observer(() => {
  const { gamesStore, usersStore } = rootStore;
  const { gameFlow } = gamesStore;
  const { getUserName } = usersStore;
  const [isOpen, setIsOpen] = useState(false);

  const onToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const proposedCount = gameFlow.proposed.length;

  if (proposedCount === 0) {
    return null;
  }

  return (
    <>
      <button
        className={styles.toggleButton}
        onClick={onToggle}
        aria-label="Toggle vote list"
      >
        Vote List
        {proposedCount > 0 && (
          <span className={styles.badge}>{proposedCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>Vote List</h3>
            <button
              className={styles.closeButton}
              onClick={onToggle}
              aria-label="Close vote list"
            >
              ×
            </button>
          </div>
          <div className={styles.listContainer}>
            <ul className={styles.list}>
              {gameFlow.proposed.map((userId) => (
                <li key={userId} className={styles.listItem}>
                  {getUserName(userId)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {isOpen && <div className={styles.overlay} onClick={onToggle} />}
    </>
  );
});
