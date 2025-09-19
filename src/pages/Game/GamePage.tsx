import { LiveKitRoom } from "@livekit/components-react";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { LIVEKIT_SERVER } from "@/api/apiConstants.ts";
import { useAddUserToGameMutation } from "@/api/game/queries.ts";
import { useGetLiveKitTokenMutation } from "@/api/livekit/queries.ts";
import { useGetUsersWithAddToStore } from "@/api/user/queries.ts";
import { GameChat } from "@/components/GameChat";
import { GameInfoSection } from "@/components/GameInfoSection";
import { GameVideoContainer } from "@/components/GameVideoContainer";
import { GameVote } from "@/components/GameVote";
import { VideoConfig } from "@/components/VideoConfig";
import { videoOptions } from "@/config/video.ts";
import { useUserMediaStream } from "@/hooks/useUserMediaStream.ts";
import { rootStore } from "@/store/rootStore.ts";

import styles from "./GamePage.module.scss";

const GamePage = observer(() => {
  const { id = "" } = useParams();
  const { usersStore, gamesStore, streamsStore } = rootStore;
  const { myId } = usersStore;
  const { setActiveGame, activeGamePlayers } = gamesStore;
  const { myStream } = streamsStore;
  const { mutate: addUserToGame } = useAddUserToGameMutation();

  useGetUsersWithAddToStore(activeGamePlayers);
  const { mutateAsync: getToken } = useGetLiveKitTokenMutation();

  const [LKToken, setLKToken] = useState("");

  useUserMediaStream({
    audio: false,
    video: videoOptions,
  });

  useEffect(() => {
    console.log("GamePage: Starting token request for:", { myId, roomId: id });
    if (!myId || !id) return;

    void getToken(
      { roomName: id, participantName: myId },
      {
        onSuccess: (data) => {
          console.log("GamePage: Token received successfully");
          setLKToken(data.data.token);
        },
        onError: (error) => {
          console.error("GamePage: Failed to get token:", error);
        },
      }
    );
  }, [myId, id, getToken]);

  useEffect(() => {
    if (!id) return;

    setActiveGame(id);
  }, [id, setActiveGame]);

  useEffect(() => {
    if (!myId || !id || !myStream) return;

    const requestTimer = setTimeout(() => {
      addUserToGame({
        userId: myId,
        gameId: id,
      });
    }, 0);

    return () => clearTimeout(requestTimer);
  }, [id, addUserToGame, myId, myStream]);

  return (
    <div className={styles.pageContainer}>
      {LKToken ? (
        <LiveKitRoom
          token={LKToken}
          serverUrl={LIVEKIT_SERVER}
          connect
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
          <VideoConfig />

          <GameVideoContainer />
        </LiveKitRoom>
      ) : (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "400px",
            fontSize: "18px",
          }}
        >
          <div>
            {!myId || !id ? (
              <p>Missing user ID or room ID...</p>
            ) : (
              <p>Loading LiveKit connection...</p>
            )}
          </div>
        </div>
      )}

      <aside className={styles.rightContainer}>
        <section
          className={classNames(styles.asideSection, styles.personalInfo)}
        >
          <GameInfoSection />
        </section>

        <section className={classNames(styles.asideSection, styles.voteList)}>
          <GameVote />
        </section>

        <section className={styles.chatSection}>
          <GameChat />
        </section>
      </aside>
    </div>
  );
});

GamePage.displayName = "GamePage";

export default GamePage;
