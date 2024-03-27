import { forwardRef, HTMLProps, memo } from "react";
import styles from "./Input.module.scss";

export const Input = memo(
  forwardRef<HTMLInputElement, HTMLProps<HTMLInputElement>>((props, ref) => {
    return <input {...props} className={styles.input} ref={ref} />;
  }),
);
