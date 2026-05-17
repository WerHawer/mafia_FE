import classNames from "classnames";
import { HTMLProps, PropsWithChildren } from "react";

import styles from "./Button.module.scss";
import {
  ButtonRadius,
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
    radius?: ButtonRadius;
    className?: string;
    type?: ButtonType;
    fullWidth?: boolean;
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
  radius = ButtonRadius.Small,
  className,
  type = ButtonType.Button,
  fullWidth = false,
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
        styles[radius],
        {
          [styles.disabled]: disabled,
          [styles.uppercase]: uppercase,
          [styles.rounded]: rounded,
          [styles.fullWidth]: fullWidth,
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
