import { wsEvents } from "../config/wsEvents.ts";
import { IMessage, IMessageDTO } from "./message.types.ts";
import { GameId, IGame } from "./game.types.ts";
import { UserId, UserStreamId } from "./user.types.ts";

export type OffParams = "self" | "other";

export interface WSSentEventData {
  [wsEvents.messageSend]: IMessageDTO;
  [wsEvents.roomLeave]: [GameId, UserId];
  [wsEvents.roomConnection]: [GameId, UserId, UserStreamId];
  [wsEvents.userAudioStatus]: {
    streamId: UserStreamId;
    roomId: GameId;
    audio: boolean;
    offParams?: OffParams;
  };
  [wsEvents.userVideoStatus]: {
    streamId: UserStreamId;
    roomId: GameId;
    video: boolean;
    offParams?: OffParams;
  };
  [wsEvents.startNight]: { gameId: GameId; gm: UserId | undefined };
  [wsEvents.startDay]: { gameId: GameId; gm: UserId | undefined };
  [wsEvents.updateSpeaker]: { userId: UserId; gameId: GameId };
  [wsEvents.wakeUp]: { gameId: GameId; users: UserId[] | UserId; gm?: UserId };
}

export type SendMessageFunction = <T extends keyof WSSentEventData>(
  event: T,
  data?: WSSentEventData[T],
) => void;

export type StreamInfo = {
  roomId: GameId;
  useTo?: UserStreamId[];
  user: {
    id: UserId;
    audio: boolean;
    video: boolean;
    offParams?: OffParams;
  };
};

export type StreamsArr = Array<[UserStreamId, StreamInfo]>;

export interface WSSubscribedEventData {
  [wsEvents.roomConnection]: {
    streamId: UserStreamId;
    streams: StreamsArr;
  };
  [wsEvents.messageSend]: IMessage;
  [wsEvents.gameUpdate]: IGame;
  [wsEvents.peerDisconnect]: {
    streamId: UserStreamId;
    streams: StreamsArr;
  };
  [wsEvents.connection]: { message: string; connectedUsers: number };
  [wsEvents.disconnect]: string;
  [wsEvents.socketDisconnect]: number;
  [wsEvents.connectionError]: Error;
  [wsEvents.userStreamStatus]: StreamsArr;
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
