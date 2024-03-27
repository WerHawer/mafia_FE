import styles from "./InputError.module.scss";

export const InputError = ({ message }: { message?: string }) => {
  return <span className={styles.errorText}>{message}</span>;
};
