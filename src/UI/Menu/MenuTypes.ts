export enum MenuItemVariant {
  Default = "default",
  Danger = "danger",
  Success = "success",
}

export interface MenuItemProps {
  icon?: React.ReactNode;
  label: string | React.ReactNode;
  onClick: () => void;
  variant?: MenuItemVariant;
  disabled?: boolean;
  className?: string;
  title?: string;
}

export interface MenuSeparatorProps {
  className?: string;
}
