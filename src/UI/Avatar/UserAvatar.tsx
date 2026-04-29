import classNames from "classnames";
import { memo, useCallback, useMemo, useState } from "react";


import { AvatarSize } from "@/types/user.types.ts";

import styles from "./UserAvatar.module.scss";

type UserAvatarProps = {
  avatar?: string | null;
  name?: string;
  size?: AvatarSize;
  customSize?: number | string; // Prop to override standard sizes
  className?: string;
  onClick?: () => void;
};

export const UserAvatar = memo(({ avatar, name, size = "sm", customSize, className, onClick }: UserAvatarProps) => {
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

  const getInitials = useCallback((fullName?: string) => {
    if (!fullName) return "?";
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  }, []);

  const initials = getInitials(name);
  
  // Custom styles for size override
  const customStyles = customSize ? { width: customSize, height: customSize } : undefined;

  return (
    <span
      className={classNames(styles.avatar, { [styles[size]]: !customSize }, className)}
      style={customStyles}
      role={onClick ? "button" : "img"}
      tabIndex={onClick ? 0 : undefined}
      aria-label={name ?? "User avatar"}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      {showInitial ? (
        <span className={styles.initial} aria-hidden={false} style={customSize ? { fontSize: `calc(${typeof customSize === 'number' ? customSize + 'px' : customSize} / 2.5)` } : undefined}>
          {initials}
        </span>
      ) : (
        <img
          src={avatar!}
          alt={name ?? "User avatar"}
          className={styles.img}
          onError={handleImageError}
        />
      )}
    </span>
  );
});

UserAvatar.displayName = "UserAvatar";
