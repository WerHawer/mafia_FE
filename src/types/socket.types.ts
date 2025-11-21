import { wsEvents } from "../config/wsEvents.ts";
import { GameId, IGame, IGameShort, IRoomConnectInfo } from "./game.types.ts";
import { IMessage, IMessageDTO } from "./message.types.ts";
import { UserId, UserStreamId } from "./user.types.ts";

export type OffParams = "self" | "other";

// Priority levels for message queue
export enum MessagePriority {
  HIGH = "high",
  NORMAL = "normal",
  LOW = "low",
}

// Queue processing constants
export const QUEUE_CONFIG = {
  DEFAULT_MAX_RETRIES: 3,
  HIGH_PRIORITY_EXTRA_RETRIES: 2,
  DEFAULT_RETRY_DELAY_MS: 1000,
  DEFAULT_MAX_QUEUE_SIZE: 100,
  BATCH_PROCESS_LIMIT: 5,
  MESSAGE_DELAY_MS: 50,
  STORAGE_EXPIRY_MS: 5 * 60 * 1000, // 5 minutes
  STORAGE_KEY: "socket-message-queue",
} as const;

// Priority mapping for queue sorting
export const PRIORITY_ORDER: Record<MessagePriority, number> = {
  [MessagePriority.HIGH]: 0,
  [MessagePriority.NORMAL]: 1,
  [MessagePriority.LOW]: 2,
} as const;

// Priority mapping for queue management (inverse for sorting by importance)
export const PRIORITY_WEIGHT: Record<MessagePriority, number> = {
  [MessagePriority.HIGH]: 2,
  [MessagePriority.NORMAL]: 1,
  [MessagePriority.LOW]: 0,
} as const;

// Critical game events that require high priority
export const HIGH_PRIORITY_EVENTS = new Set([
  wsEvents.startNight,
  wsEvents.startDay,
  wsEvents.wakeUp,
  wsEvents.updateSpeaker,
  wsEvents.roomConnection,
  wsEvents.roomLeave,
] as const);

// Normal priority events
export const NORMAL_PRIORITY_EVENTS = new Set([wsEvents.messageSend] as const);

export interface QueuedMessage<
  T extends keyof WSSentEventData = keyof WSSentEventData,
> {
  readonly id: string;
  readonly event: T;
  readonly data?: WSSentEventData[T];
  readonly timestamp: number;
  readonly priority: MessagePriority;
  readonly maxAttempts: number;
  attempts: number;
}

export interface SocketQueueConfig {
  readonly maxRetries: number;
  readonly retryDelay: number;
  readonly maxQueueSize: number;
  readonly enablePersistence: boolean;
}

export interface QueueStats {
  readonly total: number;
  readonly high: number;
  readonly normal: number;
  readonly low: number;
  readonly failed: number;
}

export interface WSSentEventData {
  [wsEvents.messageSend]: IMessageDTO;
  [wsEvents.roomLeave]: [GameId, UserId];
  [wsEvents.roomConnection]: [GameId, UserId];
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
  [wsEvents.toggleUserCamera]: {
    roomId: string;
    userId: UserId;
    participantIdentity: string;
    enabled: boolean;
    requesterId: UserId;
  };
  [wsEvents.toggleUserMicrophone]: {
    roomId: string;
    userId: UserId;
    participantIdentity: string;
    enabled: boolean;
    requesterId: UserId;
  };
  [wsEvents.batchToggleMicrophones]: {
    roomId: string;
    enabled: boolean;
    targetUserIds: UserId[];
    excludedUserIds: UserId[];
    requesterId: UserId;
  };
}

export type SendMessageFunction = <T extends keyof WSSentEventData>(
  event: T,
  data?: WSSentEventData[T]
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
  [wsEvents.roomConnection]: IRoomConnectInfo;
  [wsEvents.roomLeave]: IRoomConnectInfo;
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
  [wsEvents.gamesUpdate]: IGameShort;
  [wsEvents.addToProposed]: UserId;
  [wsEvents.vote]: { targetUserId: UserId; voterId: UserId };
  [wsEvents.shoot]: { targetUserId: UserId; shooterId: UserId };
  [wsEvents.userCameraStatusChanged]: { userId: UserId; enabled: boolean };
  [wsEvents.userMicrophoneStatusChanged]: { userId: UserId; enabled: boolean };
}

export type SubscribeEvent = keyof WSSubscribedEventData;
export type SubscribeCallback<T extends SubscribeEvent> = (
  data: WSSubscribedEventData[T]
) => void;

export type ListenFunction = <T extends SubscribeEvent>(
  event: T,
  data: WSSubscribedEventData[T]
) => void;

export type SubscribeFunction = <T extends SubscribeEvent>(
  event: T,
  cb: SubscribeCallback<T>
) => () => void;

export type MassSubscribeEvents = {
  [Event in SubscribeEvent]?: SubscribeCallback<Event>;
};

export type MassSubscribeFunction = (events: MassSubscribeEvents) => () => void;
