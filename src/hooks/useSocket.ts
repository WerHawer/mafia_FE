import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SERVER } from '../api/apiConstants.ts';
import { IUser } from '../App.tsx';

export const useSocket = (user?: IUser) => {
  const [socketInstance, setSocketInstance] = useState<Socket>();
  const [userCount, setUserCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user || isConnected) return;

    const server = SERVER;

    const socket = io(server, {
      transports: ['websocket'],
      query: {
        user: user.id,
      },
    });

    socket.on('connect_error', (err) => {
      console.log('Error connecting to WebSocket server:', err.message);
    });

    socket.on('connectMessage', (usersCount) => {
      setUserCount(usersCount);
      setIsConnected(true);
      setSocketInstance(socket);

      console.log('Connected users:', usersCount);
    });
  }, [user, isConnected]);

  useEffect(() => {
    return () => {
      socketInstance?.disconnect();
      setIsConnected(false);
    };
  }, []);

  return { socket: socketInstance, userCount, isConnected };
};
