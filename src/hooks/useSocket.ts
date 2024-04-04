import { useCallback, useContext } from "react";
import { wsEvents } from "../config/wsEvents.ts";
import { SocketContext } from "../context/SocketProvider.tsx";
import { IMessage, IMessageDTO } from "../types/message.ts";
import { GameId, IGame } from "../types/game.ts";
import { UserId, UserStreamId } from "../types/user.ts";

export interface WSSentEventData {
  [wsEvents.messageSendPrivate]: IMessageDTO;
  [wsEvents.messageSend]: IMessageDTO;
  [wsEvents.userConnectedCount]: undefined;
  [wsEvents.roomLeave]: [GameId, UserId];
  [wsEvents.roomConnection]: [GameId, UserId, UserStreamId];
}

type SendMessageFunction = <T extends keyof WSSentEventData>(
  event: T,
  data?: WSSentEventData[T],
) => void;

export interface WSSubscribedEventData {
  [wsEvents.roomConnection]: (id: UserId) => void;
  [wsEvents.userConnectedCount]: (connections: number) => void;
  [wsEvents.messagesGetRoom]: (messages: IMessage[]) => void;
  [wsEvents.messageSend]: (message: IMessage) => void;
  [wsEvents.messageSendPrivate]: (message: IMessage) => void;
  [wsEvents.updateGame]: (game: IGame) => void;
  [wsEvents.peerDisconnect]: (id: UserId) => void;
}

type SubscribeFunction = <T extends keyof WSSubscribedEventData>(
  event: T,
  cb: WSSubscribedEventData[T],
) => () => void;

export const useSocket = () => {
  const { socket, isContext } = useContext(SocketContext);

  if (!isContext) {
    throw new Error("useSocket must be used within a SocketProvider");
  }

  const isConnected = socket?.connected;

  const sendMessage: SendMessageFunction = useCallback(
    (event, data) => {
      socket?.emit(event, data);
    },
    [socket],
  );

  const subscribe: SubscribeFunction = useCallback(
    (event, cb) => {
      // @ts-ignore
      socket?.on(event, cb);

      return () => {
        // @ts-ignore
        socket?.off(event, cb);
      };
    },
    [socket],
  );

  const connect = useCallback(() => {
    socket?.connect();
  }, [socket]);

  const disconnect = useCallback(() => {
    socket?.disconnect();
  }, [socket]);

  return { socket, sendMessage, subscribe, isConnected, disconnect, connect };
};
