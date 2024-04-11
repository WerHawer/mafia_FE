import { usersStore } from "../../store/usersStore.ts";
import { observer } from "mobx-react-lite";
import { gamesStore } from "../../store/gamesStore.ts";
import styles from "./GameInfoSection.module.scss";
import { GmPanel } from "./GmPanel";
import { PlayerPanel } from "./PlayerPanel.tsx";

export const GameInfoSection = observer(() => {
  const { activeGameGm } = gamesStore;
  const { myId } = usersStore;
  const isPlayerGM = activeGameGm === myId;

  return (
    <div className={styles.container}>
      {isPlayerGM ? <GmPanel /> : <PlayerPanel />}
    </div>
  );
});

GameInfoSection.displayName = "GameInfoSection";
