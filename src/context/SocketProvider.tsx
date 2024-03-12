import { createContext, PropsWithChildren, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SERVER } from '../api/apiConstants.ts';
import { wsEvents } from '../config/wsEvents.ts';
import { useUser } from '../hooks/useUser.ts';
import { UserModal } from '../components/UserModal.tsx';
import { IUser } from '../types/user';

export const SocketContext = createContext<Socket | null>(null);
export const UserContext = createContext<IUser | null>(null);

export const SocketProvider = ({ children }: PropsWithChildren) => {
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, users, setUser } = useUser();

  useEffect(() => {
    if (!user || isConnected) return;

    const socket = io(SERVER, {
      query: {
        user: user.id,
      },
    });

    socket.on(wsEvents.connectionError, (err) => {
      console.log('Error connecting to WebSocket server:', err.message);
    });

    socket.on(wsEvents.connection, () => {
      setIsConnected(true);
      setSocketInstance(socket);
    });
  }, [user, isConnected]);

  useEffect(() => {
    return () => {
      socketInstance?.disconnect();
      setIsConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <UserContext.Provider value={user}>
      <SocketContext.Provider value={socketInstance}>
        <>
          <UserModal setUser={setUser} users={users} user={user} />
          {children}
        </>
      </SocketContext.Provider>
    </UserContext.Provider>
  );
};
