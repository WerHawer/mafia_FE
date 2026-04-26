import noAvatar from "@/assets/images/noAvatar.jpg";

/**
 * Returns the URL for the given avatar.
 * Falls back to the default noAvatar image when the avatar is missing.
 */
export const getAvatarUrl = (avatar?: string): string => {
  if (!avatar) return noAvatar;
  return avatar;
};
