import "tippy.js/dist/tippy.css";

import Tippy, { TippyProps } from "@tippyjs/react";

export const PopupMenu = ({
  children,
  content,
  placement = "bottom-end",
  trigger = "click",
  hideOnClick = true,
  arrow = false,
  ...rest
}: TippyProps) => {
  return (
    <Tippy
      content={<div>{content}</div>}
      arrow={arrow}
      hideOnClick={hideOnClick}
      trigger={trigger}
      placement={placement}
      interactive
      {...rest}
    >
      {children}
    </Tippy>
  );
};
