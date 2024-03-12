import { PropsWithChildren } from 'react';
import styles from './Button.module.scss';
import classNames from 'classnames';

type ButtonSize = 'small' | 'medium' | 'large';
type ButtonVariant = 'primary' | 'secondary';

type ButtonProps = PropsWithChildren<{
  onClick: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  uppercase?: boolean;
}>;

export const Button = ({
  children,
  onClick,
  uppercase = false,
  disabled = false,
  size = 'medium',
  variant = 'primary',
}: ButtonProps) => {
  return (
    <button
      className={classNames(styles.button, styles[size], styles[variant], {
        [styles.disabled]: disabled,
        [styles.uppercase]: uppercase,
      })}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
