import classNames from "classnames";
import { HTMLProps, PropsWithChildren } from "react";

import styles from "./Button.module.scss";
import {
  ButtonSize,
  ButtonType,
  ButtonVariant,
  ButtonWidth,
} from "./ButtonTypes.ts";

type ButtonProps = Omit<HTMLProps<HTMLButtonElement>, "size"> &
  PropsWithChildren<{
    onClick?: () => void;
    disabled?: boolean;
    variant?: ButtonVariant;
    size?: ButtonSize;
    width?: ButtonWidth;
    uppercase?: boolean;
    rounded?: boolean;
    className?: string;
    type?: ButtonType;
  }>;

//TODO: Add loading state
export const Button = ({
  children,
  onClick,
  uppercase = false,
  disabled = false,
  size = ButtonSize.Medium,
  width = "auto",
  variant = ButtonVariant.Primary,
  rounded = false,
  className,
  type = ButtonType.Button,
  ...rest
}: ButtonProps) => {
  return (
    <button
      {...rest}
      className={classNames(
        styles.button,
        styles[size],
        styles[variant],
        styles[width],
        {
          [styles.disabled]: disabled,
          [styles.uppercase]: uppercase,
          [styles.rounded]: rounded,
        },
        className
      )}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
};
