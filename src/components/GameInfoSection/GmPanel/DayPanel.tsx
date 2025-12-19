import { SpeakerBlock } from "@/components/GameInfoSection/GmPanel/SpeakerBlock/SpeakerBlock.tsx";

import styles from "./GmPanel.module.scss";

export const DayPanel = () => {
  return (
    <div className={styles.dayContainer}>
      <SpeakerBlock />
    </div>
  );
};

DayPanel.displayName = "DayPanel";
