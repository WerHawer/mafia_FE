import classNames from "classnames";
import { memo, useCallback, useMemo, useState } from "react";

import { getAvatarUrl, getAvatarSrcSet } from "@/helpers/getAvatarUrl.ts";
import { AvatarSize, IAvatar, IAvatarItem } from "@/types/user.types.ts";

import styles from "./UserAvatar.module.scss";

type UserAvatarProps = {
  /** avatar can be an IAvatar object or a direct string URL (for legacy places) */
  avatar?: IAvatar | IAvatarItem[] | string;
  name: string;
  size?: AvatarSize;
  className?: string;
  /** Pixel size for srcSet `sizes` hint (e.g. "60px", "96px") */
  sizesHint?: string;
  onClick?: () => void;
};

export const UserAvatar = memo(({ avatar, name, size = "sm", className, sizesHint, onClick }: UserAvatarProps) => {
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

  const isStringAvatar = typeof avatar === "string";

  const showInitial = useMemo(() => {
    if (hasError) return true;
    if (!avatar) return true;
    if (Array.isArray(avatar) && avatar.length === 0) return true;
    return false;
  }, [avatar, hasError]);

  const getInitials = useCallback((fullName: string) => {
    if (!fullName) return "?";
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }, []);

  const initials = getInitials(name);

  // If avatar is a plain string URL we will use it directly, otherwise use helper
  const src = isStringAvatar ? (avatar as string) : getAvatarUrl(avatar as IAvatar | IAvatarItem[] | undefined, size);
  const srcSet = isStringAvatar ? undefined : getAvatarSrcSet(avatar as IAvatar | IAvatarItem[] | undefined);

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
          srcSet={srcSet}
          sizes={sizesHint}
          alt={name}
          className={styles.img}
          onError={handleImageError}
        />
      )}
    </span>
  );
});

UserAvatar.displayName = "UserAvatar";


