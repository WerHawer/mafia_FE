import { useCallback } from "react";
import { DislikeFilled, DislikeOutlined } from "@ant-design/icons";
import { Button } from "@/UI/Button";
import { ButtonSize } from "@/UI/Button/ButtonTypes.ts";

type VoteIconProps = {
  onClick?: () => void;
  isVoted?: boolean;
  className?: string;
  size?: ButtonSize;
};

export const VoteIcon = ({
  onClick,
  isVoted,
  className,
  size,
}: VoteIconProps) => {
  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  return (
    <Button rounded onClick={handleClick} className={className} size={size}>
      {isVoted ? <DislikeFilled /> : <DislikeOutlined />}
    </Button>
  );
};

VoteIcon.displayName = "VoteIcon";
