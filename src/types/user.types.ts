export type UserId = string;
export type UserStreamId = string;

export type AvatarSize = "sm" | "md" | "lg";

export type UserVideoSettings = {
  withBlur: boolean;
  imageURL: string;
};

export interface IUser {
  email?: string;
  nikName: string;
  friendList: [];
  isOnline: boolean;
  avatar?: string;
  id: UserId;
  // history: [],
}
