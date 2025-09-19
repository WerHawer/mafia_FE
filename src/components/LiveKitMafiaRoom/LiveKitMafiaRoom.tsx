import { LiveKitRoom } from "@livekit/components-react";
import { observer } from "mobx-react-lite";
import { ReactNode, useEffect, useState } from "react";

import { LIVEKIT_SERVER } from "@/api/apiConstants.ts";
import { useGetLiveKitTokenMutation } from "@/api/livekit/queries.ts";
import { rootStore } from "@/store/rootStore.ts";

type LiveKitMafiaRoomProps = {
  children?: ReactNode;
};

export const LiveKitMafiaRoom = observer(
  ({ children }: LiveKitMafiaRoomProps) => {
    const [LKToken, setLKToken] = useState("");

    const { usersStore, gamesStore } = rootStore;
    const { myId } = usersStore;
    const { activeGameId: id } = gamesStore;

    const { mutateAsync: getToken } = useGetLiveKitTokenMutation();

    useEffect(() => {
      if (!myId || !id) return;

      void getToken(
        { roomName: id, participantName: myId },
        {
          onSuccess: (data) => {
            setLKToken(data.data.token);
          },
          onError: (error) => {
            console.error("GamePage: Failed to get token:", error);
          },
        }
      );
    }, [myId, id, getToken]);

    return (
      <LiveKitRoom
        token={LKToken}
        serverUrl={LIVEKIT_SERVER}
        connect={!!LKToken}
        video={false}
        audio={{
          echoCancellation: true,
          noiseSuppression: true,
        }}
        connectOptions={{
          autoSubscribe: true,
        }}
        onConnected={() => {
          console.log("GamePage: Successfully connected to LiveKit room");
        }}
        onDisconnected={() => {
          console.log("GamePage: Disconnected from LiveKit room");
        }}
        onError={(error) => {
          console.error("GamePage: LiveKit room error:", error);
        }}
      >
        {children}
      </LiveKitRoom>
    );
  }
);
