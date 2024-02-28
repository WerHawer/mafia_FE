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
    });

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
