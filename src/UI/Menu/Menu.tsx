import classNames from "classnames";
import { PropsWithChildren } from "react";

import styles from "./Menu.module.scss";
import {
  MenuItemProps,
  MenuItemVariant,
  MenuSeparatorProps,
} from "./MenuTypes";

export const Menu = ({ children }: PropsWithChildren) => {
  return <div className={styles.menu}>{children}</div>;
};

export const MenuItem = ({
  icon,
  label,
  onClick,
  variant = MenuItemVariant.Default,
  disabled = false,
  className,
}: MenuItemProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && !disabled) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <button
      className={classNames(
        styles.menuItem,
        {
          [styles.disabled]: disabled,
          [styles.danger]: variant === MenuItemVariant.Danger,
          [styles.success]: variant === MenuItemVariant.Success,
        },
        className
      )}
      onClick={!disabled ? onClick : undefined}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
    >
      {icon && <span className={styles.menuItemIcon}>{icon}</span>}
      <span className={styles.menuItemText}>{label}</span>
    </button>
  );
};

export const MenuSeparator = ({ className }: MenuSeparatorProps) => {
  return (
    <div className={classNames(styles.separator, className)} role="separator" />
  );
};

MenuItem.displayName = "MenuItem";
Menu.displayName = "Menu";
MenuSeparator.displayName = "MenuSeparator";
