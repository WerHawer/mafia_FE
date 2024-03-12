import { IUser } from './user';

type MessageTypesWithId = 'user' | 'room';
type MessageGeneralTypes = 'all';

type To =
  | {
      type: MessageGeneralTypes;
    }
  | {
      type: MessageTypesWithId;
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

export interface IMessage extends Omit<IMessageDTO, 'sender'> {
  sender: IUser;
}
