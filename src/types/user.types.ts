export type UserId = string;
export type UserStreamId = string;

export type UserVideoSettings = {
  withBlur: boolean;
  imageURL: string;
};

export interface IUser {
  email?: string;
  nickName: string;
  friendList: [];
  isOnline: true;
  avatar?: string;
  id: UserId;
  // history: [],
}
