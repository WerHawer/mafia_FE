import { SpeakerBlock } from "@/components/GameInfoSection/GmPanel/SpeakerBlock/SpeakerBlock.tsx";
import { VotePanel } from "@/components/GameInfoSection/GmPanel/VotePanel/VotePanel.tsx";

import styles from "./GmPanel.module.scss";

export const DayPanel = () => {
  return (
    <div className={styles.dayContainer}>
      <SpeakerBlock />
      <VotePanel />
    </div>
  );
};

DayPanel.displayName = "DayPanel";
