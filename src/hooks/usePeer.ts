import Peer from "peerjs";
import { useEffect, useState } from "react";

import { IS_PROD, PEER_PORT, PEER_SERVER } from "../api/apiConstants.ts";

export const usePeer = (userId?: string) => {
  const [peerId, setPeerId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [peerInstance, setPeerInstance] = useState<Peer>();

  useEffect(() => {
    if (isConnected || peerId || !userId) return;

    const peer = new Peer(userId, {
      host: PEER_SERVER,
      port: IS_PROD ? 443 : PEER_PORT,
      path: "/peerjs/mafia",
      secure: IS_PROD,
    });

    peer.on("open", (id) => {
      setPeerId(id);
      setIsConnected(true);
      setPeerInstance(peer);
    });
  }, [peerId, isConnected, userId]);

  useEffect(() => {
    return () => {
      peerInstance?.disconnect();
      setIsConnected(false);
    };
  }, [peerInstance]);

  return { peer: peerInstance, peerId, isConnected };
};
