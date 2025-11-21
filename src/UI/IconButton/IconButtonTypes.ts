import { ButtonSize, ButtonVariant } from "../Button/ButtonTypes";

export interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
  className?: string;
  ariaLabel: string;
}
