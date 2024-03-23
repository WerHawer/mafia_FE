export type UserId = string;

export interface IUser {
  email: string;
  name: string;
  nikName?: string;
  friendList: [];
  isOnline: true;
  avatar?: string;
  id: UserId;
  // history: [],
}
