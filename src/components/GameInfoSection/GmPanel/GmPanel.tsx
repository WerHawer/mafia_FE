import { observer } from "mobx-react-lite";

import { GamePanel } from "@/components/GameInfoSection/GmPanel/GamePanel.tsx";
import { InitialPanel } from "@/components/GameInfoSection/GmPanel/InitialPanel.tsx";
import { gamesStore } from "@/store/gamesStore.ts";

import styles from "./GmPanel.module.scss";

export const GmPanel = observer(() => {
  const { gameFlow } = gamesStore;

  return (
    <div className={styles.gmPanel}>
      {!gameFlow.isStarted ? <InitialPanel /> : <GamePanel />}
    </div>
  );
});

GmPanel.displayName = "GmPanel";
