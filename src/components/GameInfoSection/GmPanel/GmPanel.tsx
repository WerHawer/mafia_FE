import { observer } from "mobx-react-lite";
import { gamesStore } from "@/store/gamesStore.ts";
import { InitialPanel } from "@/components/GameInfoSection/GmPanel/InitialPanel.tsx";
import styles from "./GmPanel.module.scss";
import { GamePanel } from "@/components/GameInfoSection/GmPanel/GamePanel.tsx";

export const GmPanel = observer(() => {
  const { gameFlow } = gamesStore;

  return (
    <div className={styles.gmPanel}>
      {!gameFlow.isStarted ? <InitialPanel /> : <GamePanel />}
    </div>
  );
});

GmPanel.displayName = "GmPanel";
