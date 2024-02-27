import { useEffect, useState } from 'react';
import Peer from 'peerjs';

export const usePeer = () => {
  const [peerId, setPeerId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [peerInstance, setPeerInstance] = useState<Peer>();

  useEffect(() => {
    if (isConnected || peerId) return;

    const peer = new Peer('', {
      host: '/',
      port: 5000,
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
