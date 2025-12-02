import { memo } from "react";

import styles from "./SoundIndicator.module.scss";

export const SoundIndicator = memo(() => {
  return (
    <div className={styles.soundIndicator}>
      <div className={styles.bar} />
      <div className={styles.bar} />
      <div className={styles.bar} />
    </div>
  );
});

SoundIndicator.displayName = "SoundIndicator";
