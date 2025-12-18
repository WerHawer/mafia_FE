import { ReactNode } from "react";
import { Placement } from "tippy.js";

export interface DropdownProps {
  trigger: ReactNode;
  content: ReactNode;
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
  placement?: Placement;
  className?: string;
  appendTo?: HTMLElement;
}
