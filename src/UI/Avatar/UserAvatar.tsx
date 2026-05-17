import classNames from "classnames";
import { memo, useCallback, useMemo, useState } from "react";

import { AvatarSize } from "@/types/user.types.ts";

import styles from "./UserAvatar.module.scss";

function getAvatarBgColor(name?: string): string | undefined {
  if (!name) return undefined;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;

  return `hsl(${hue}, 45%, 40%)`;
}

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

  const bgColor = useMemo(() => (showInitial ? getAvatarBgColor(name) : undefined), [showInitial, name]);

  const customStyles = customSize ? { width: customSize, height: customSize } : undefined;
  const avatarStyle = {
    ...customStyles,
    ...(bgColor ? { backgroundColor: bgColor } : {}),
  };

  return (
    <span
      className={classNames(styles.avatar, { [styles[size]]: !customSize }, className)}
      style={avatarStyle}
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
