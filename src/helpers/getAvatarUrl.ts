import noAvatar from "@/assets/images/noAvatar.jpg";

import { AvatarSize, IAvatar } from "@/types/user.types.ts";

/**
 * Returns the URL for the given avatar size.
 * Falls back to the default noAvatar image when the avatar is missing.
 */
export const getAvatarUrl = (avatar: IAvatar | undefined, size: AvatarSize): string => {
  if (!avatar) return noAvatar;

  return avatar[size];
};

/**
 * Builds a srcSet string for responsive image loading.
 * Suitable for use with the `sizes` attribute on <img>.
 *
 * Example output: "https://…/avatar_sm.jpg 100w, https://…/avatar_md.jpg 300w, https://…/avatar_lg.jpg 600w"
 */
export const getAvatarSrcSet = (avatar: IAvatar | undefined): string | undefined => {
  if (!avatar) return undefined;

  return `${avatar.sm} 100w, ${avatar.md} 300w, ${avatar.lg} 600w`;
};

