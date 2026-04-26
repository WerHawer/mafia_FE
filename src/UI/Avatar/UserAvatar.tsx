import classNames from "classnames";
import { memo, useCallback, useMemo, useState } from "react";

import { getAvatarUrl } from "@/helpers/getAvatarUrl.ts";
import { AvatarSize } from "@/types/user.types.ts";

import styles from "./UserAvatar.module.scss";

type UserAvatarProps = {
  avatar?: string;
  name: string;
  size?: AvatarSize;
  className?: string;
  onClick?: () => void;
};

export const UserAvatar = memo(({ avatar, name, size = "sm", className, onClick }: UserAvatarProps) => {
  const [hasError, setHasError] = useState(false);

  const handleImageError = useCallback(() => {
    setHasError(true);
  }, []);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  }, [onClick]);

  const showInitial = useMemo(() => {
    if (hasError || !avatar) return true;
    return false;
  }, [avatar, hasError]);

  const getInitials = useCallback((fullName: string) => {
    if (!fullName) return "?";
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  }, []);

  const initials = getInitials(name);
  const src = getAvatarUrl(avatar);

  return (
    <span
      className={classNames(styles.avatar, styles[size], className)}
      role={onClick ? "button" : "img"}
      tabIndex={onClick ? 0 : undefined}
      aria-label={name}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      {showInitial ? (
        <span className={styles.initial} aria-hidden={false}>
          {initials}
        </span>
      ) : (
        <img
          src={src}
          alt={name}
          className={styles.img}
          onError={handleImageError}
        />
      )}
    </span>
  );
});

UserAvatar.displayName = "UserAvatar";
