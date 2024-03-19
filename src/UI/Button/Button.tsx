import { HTMLProps, PropsWithChildren } from "react";
import styles from "./Button.module.scss";
import classNames from "classnames";

export enum ButtonSize {
  Small = "small",
  Medium = "medium",
  Large = "large",
}

export enum ButtonVariant {
  Primary = "primary",
  Secondary = "secondary",
}

type buttonType = "button" | "submit" | "reset";

type ButtonProps = Omit<HTMLProps<HTMLButtonElement>, "size"> &
  PropsWithChildren<{
    onClick: () => void;
    disabled?: boolean;
    variant?: ButtonVariant;
    size?: ButtonSize;
    uppercase?: boolean;
    rounded?: boolean;
    className?: string;
    type?: buttonType;
  }>;

export const Button = ({
  children,
  onClick,
  uppercase = false,
  disabled = false,
  size = ButtonSize.Medium,
  variant = ButtonVariant.Primary,
  rounded = false,
  className,
  type = "button",
  ...rest
}: ButtonProps) => {
  return (
    <button
      {...rest}
      className={classNames(
        styles.button,
        styles[size],
        styles[variant],
        {
          [styles.disabled]: disabled,
          [styles.uppercase]: uppercase,
          [styles.rounded]: rounded,
        },
        className,
      )}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
};
