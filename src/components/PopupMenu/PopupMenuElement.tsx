import { PropsWithChildren } from "react";

import styles from "./PopupMenu.module.scss";

type PopupMenuElementProps = PropsWithChildren<{
  onClick: () => void;
}>;

export const PopupMenuElement = ({
  children,
  onClick,
}: PopupMenuElementProps) => {
  return (
    <p onClick={onClick} className={styles.menuElement}>
      {children}
    </p>
  );
};
