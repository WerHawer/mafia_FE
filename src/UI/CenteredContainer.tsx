import { memo, PropsWithChildren } from "react";
import styles from "./CenteredContainer.module.scss";
import classNames from "classnames";

type CenteredContainerProps = {
  position?: "top" | "center" | "bottom";
};

export const CenteredContainer = memo(
  ({
    children,
    position = "center",
  }: PropsWithChildren<CenteredContainerProps>) => {
    return (
      <div className={classNames(styles.container, styles[position])}>
        {children}
      </div>
    );
  },
);
