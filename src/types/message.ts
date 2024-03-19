import { IUser } from "./user";

export enum MessageTypes {
  User = "user",
  Room = "room",
  All = "all",
}

type To =
  | {
      type: MessageTypes.All;
    }
  | {
      type: MessageTypes.Room | MessageTypes.User;
      id: string;
    };

export interface IMessageDTO {
  text: string;
  sender: string;
  to?: To;
  date: Date;
  isRead: boolean;
  id?: string;
}

export interface IMessage extends Omit<IMessageDTO, "sender"> {
  sender: IUser;
}
