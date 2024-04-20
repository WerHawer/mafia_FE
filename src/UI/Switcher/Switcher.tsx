import styles from "./Switcher.module.scss";

type SwitcherProps = {
  checked: boolean;
  onChange: () => void;
};

export const Switcher = ({ checked, onChange }: SwitcherProps) => {
  return (
    <div className={styles.container}>
      <label className={styles.label}>
        <input
          type="checkbox"
          className={styles.input}
          checked={checked}
          onChange={onChange}
        />
      </label>
    </div>
  );
};

Switcher.displayName = "Switcher";
