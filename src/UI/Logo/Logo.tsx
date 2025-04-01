import classNames from "classnames";

import styles from "./Logo.module.scss";

type LogoProps = {
  size?: "small" | "medium" | "large";
  position?: "center" | "left" | "right";
  className?: string;
};

export const Logo = ({
  size = "medium",
  position = "left",
  className,
}: LogoProps) => {
  return (
    <div
      className={classNames(
        className,
        styles.logo,
        styles[size],
        styles[position],
      )}
    >
      Mafia
    </div>
  );
};
