import classNames from "classnames";

import { ButtonSize, ButtonVariant } from "../Button/ButtonTypes";
import styles from "./IconButton.module.scss";
import { IconButtonProps } from "./IconButtonTypes";

export const IconButton = ({
  icon,
  onClick,
  disabled = false,
  variant = ButtonVariant.Secondary,
  size = ButtonSize.Medium,
  active = false,
  className,
  ariaLabel,
}: IconButtonProps) => {
  return (
    <button
      className={classNames(
        styles.iconButton,
        styles[variant],
        styles[size],
        {
          [styles.active]: active,
        },
        className
      )}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      aria-label={ariaLabel}
      type="button"
    >
      <span className={styles.icon}>{icon}</span>
    </button>
  );
};

IconButton.displayName = "IconButton";
