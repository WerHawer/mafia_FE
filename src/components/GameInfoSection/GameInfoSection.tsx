import { observer } from "mobx-react-lite";

import { rootStore } from "@/store/rootStore.ts";

import { CopyGameLinkButton } from "./CopyGameLinkButton.tsx";
import styles from "./GameInfoSection.module.scss";
import { GmPanel } from "./GmPanel";
import { PlayerPanel } from "./PlayerPanel/PlayerPanel.tsx";

export const GameInfoSection = observer(() => {
  const { isIGM } = rootStore;

  return (
    <div className={styles.container}>
      {isIGM ? <GmPanel /> : <PlayerPanel />}
      <CopyGameLinkButton />
    </div>
  );
});

GameInfoSection.displayName = "GameInfoSection";
