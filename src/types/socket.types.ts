import { wsEvents } from "../config/wsEvents.ts";
import { IMessage, IMessageDTO } from "./message.types.ts";
import { GameId, IGame } from "./game.types.ts";
import { UserId, UserStreamId } from "./user.types.ts";

export interface WSSentEventData {
  [wsEvents.messageSend]: IMessageDTO;
  [wsEvents.roomLeave]: [GameId, UserId];
  [wsEvents.roomConnection]: [GameId, UserId, UserStreamId];
}

export type SendMessageFunction = <T extends keyof WSSentEventData>(
  event: T,
  data?: WSSentEventData[T],
) => void;

export interface WSSubscribedEventData {
  [wsEvents.roomConnection]: UserId;
  [wsEvents.messageSend]: IMessage;
  [wsEvents.updateGame]: IGame;
  [wsEvents.peerDisconnect]: UserId;
  [wsEvents.connection]: { message: string; connectedUsers: number };
  [wsEvents.disconnect]: string;
  [wsEvents.socketDisconnect]: number;
  [wsEvents.connectionError]: Error;
}

export type SubscribeEvent = keyof WSSubscribedEventData;
export type SubscribeCallback<T extends SubscribeEvent> = (
  data: WSSubscribedEventData[T],
) => void;

export type ListenFunction = <T extends SubscribeEvent>(
  event: T,
  data: WSSubscribedEventData[T],
) => void;

export type SubscribeFunction = <T extends SubscribeEvent>(
  event: T,
  cb: SubscribeCallback<T>,
) => () => void;

export type MassSubscribeEvents = {
  [Event in SubscribeEvent]?: SubscribeCallback<Event>;
};

export type MassSubscribeFunction = (events: MassSubscribeEvents) => () => void;
