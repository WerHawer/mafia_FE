import styles from "./GmPanel.module.scss";
import { VotePanel } from "@/components/GameInfoSection/GmPanel/VotePanel.tsx";
import { SpeakerBlock } from "@/components/GameInfoSection/GmPanel/SpeakerBlock.tsx";

export const DayPanel = () => {
  return (
    <div className={styles.dayContainer}>
      <SpeakerBlock />
      <VotePanel />
    </div>
  );
};

DayPanel.displayName = "DayPanel";
