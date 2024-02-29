import { useEffect, useState } from 'react';
import Peer from 'peerjs';
import { IS_PROD, PEER_PORT, PEER_SERVER } from '../api/apiConstants.ts';
import { IUser } from '../App.tsx';

export const usePeer = (user?: IUser) => {
  const [peerId, setPeerId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [peerInstance, setPeerInstance] = useState<Peer>();

  useEffect(() => {
    if (isConnected || peerId || !user) return;

    const peer = new Peer('', {
      host: PEER_SERVER,
      port: IS_PROD ? 443 : PEER_PORT,
      path: '/peerjs/mafia',
      secure: IS_PROD,
    });

    console.log("=>(usePeer.ts:19) import.meta.env.PROD'", IS_PROD);
    console.log('=>(usePeer.ts:18) PEER_PORT->3', PEER_PORT);
    console.log('=>(usePeer.ts:18) PEER_SERVER->3', PEER_SERVER);

    peer.on('open', (id) => {
      setPeerId(id);
      setIsConnected(true);
      setPeerInstance(peer);
    });
  }, [peerId, isConnected, user]);

  useEffect(() => {
    return () => {
      peerInstance?.disconnect();
      setIsConnected(false);
    };
  }, [peerInstance]);

  return { peer: peerInstance, peerId, isConnected };
};
