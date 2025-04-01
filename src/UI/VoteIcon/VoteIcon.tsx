import { DislikeFilled, DislikeOutlined } from "@ant-design/icons";
import { useCallback } from "react";

import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";

type VoteIconProps = {
  onClick?: () => void;
  isVoted?: boolean;
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

export const VoteIcon = ({
  onClick,
  isVoted,
  className,
  size,
  variant,
}: VoteIconProps) => {
  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  return (
    <Button
      rounded
      onClick={handleClick}
      className={className}
      size={size}
      variant={variant}
    >
      {isVoted ? <DislikeFilled /> : <DislikeOutlined />}
    </Button>
  );
};

VoteIcon.displayName = "VoteIcon";
