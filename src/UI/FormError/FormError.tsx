import { memo } from "react";
import styles from "./FormError.module.scss";

export const FormError = memo(({ error }: { error?: string }) => {
  if (!error) return null;

  return <div className={styles.error}>{error}</div>;
});
