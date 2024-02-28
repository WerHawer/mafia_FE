import { useEffect, useState } from 'react';
import Peer from 'peerjs';
import { PEER_PORT, PEER_SERVER } from '../api/apiConstants.ts';

export const usePeer = () => {
  const [peerId, setPeerId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [peerInstance, setPeerInstance] = useState<Peer>();

  useEffect(() => {
    if (isConnected || peerId) return;

    const peer = new Peer('', {
      host: PEER_SERVER,
      port: PEER_PORT,
      path: '/peerjs/video',
      secure: import.meta.env.NODE_ENV === 'production',
    });
    console.log(
      "=>(usePeer.ts:19) import.meta.env.NODE_ENV === 'production'",
      import.meta.env.NODE_ENV === 'production'
    );
    console.log('=>(usePeer.ts:18) PEER_PORT->1', PEER_PORT);
    console.log('=>(usePeer.ts:18) PEER_SERVER->1', PEER_SERVER);

    peer.on('open', (id) => {
      setPeerId(id);
      setIsConnected(true);
      setPeerInstance(peer);
    });
  }, [peerId, isConnected]);

  useEffect(() => {
    return () => {
      peerInstance?.disconnect();
      setIsConnected(false);
    };
  }, [peerInstance]);

  return { peer: peerInstance, peerId, isConnected };
};
