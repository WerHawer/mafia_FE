import Tippy from "@tippyjs/react";
import classNames from "classnames";

import styles from "./Dropdown.module.scss";
import { DropdownProps } from "./DropdownTypes";

export const Dropdown = ({
  trigger,
  content,
  isOpen,
  onToggle,
  placement = "bottom-end",
  className,
}: DropdownProps) => {
  return (
    <Tippy
      content={content}
      visible={isOpen}
      onClickOutside={() => onToggle(false)}
      placement={placement}
      interactive
      arrow={false}
      className={classNames(styles.dropdown, className)}
    >
      <div>{trigger}</div>
    </Tippy>
  );
};

Dropdown.displayName = "Dropdown";
