import { HTMLProps } from "react";
import styles from "./Input.module.scss";

export const Input = (props: HTMLProps<HTMLInputElement>) => {
  return <input {...props} className={styles.input} />;
};
