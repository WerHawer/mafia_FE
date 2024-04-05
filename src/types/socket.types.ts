import { wsEvents } from "../config/wsEvents.ts";
import { IMessage, IMessageDTO } from "./message.types.ts";
import { GameId, IGame } from "./game.types.ts";
import { UserId, UserStreamId } from "./user.types.ts";

export interface WSSentEventData {
  [wsEvents.messageSend]: IMessageDTO;
  [wsEvents.userConnectedCount]: undefined;
  [wsEvents.roomLeave]: [GameId, UserId];
  [wsEvents.roomConnection]: [GameId, UserId, UserStreamId];
}

export type SendMessageFunction = <T extends keyof WSSentEventData>(
  event: T,
  data?: WSSentEventData[T],
) => void;

export interface WSSubscribedEventData {
  [wsEvents.roomConnection]: (id: UserId) => void;
  [wsEvents.userConnectedCount]: (connections: number) => void;
  [wsEvents.messageSend]: (message: IMessage) => void;
  [wsEvents.updateGame]: (game: IGame) => void;
  [wsEvents.peerDisconnect]: (id: UserId) => void;
}

export type SubscribeFunction = <T extends keyof WSSubscribedEventData>(
  event: T,
  cb: WSSubscribedEventData[T],
) => () => void;
