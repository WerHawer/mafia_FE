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
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [videoVersion, setVideoVersion] = useState<"custom" | "ultra">(
    "custom"
  );

  useUserMediaStream({
    audio: true,
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

  const cycleVideoVersion = () => {
    setVideoVersion((prev) => (prev === "custom" ? "ultra" : "custom"));
  };

  return (
    <div className={styles.pageContainer}>
      <VideoConfig />

      {/* Version cycle button */}
      <button
        onClick={cycleVideoVersion}
        style={{
          position: "fixed",
          top: "160px",
          right: "10px",
          zIndex: 1000,
          padding: "8px 12px",
          backgroundColor: videoVersion === "custom" ? "#4CAF50" : "#E91E63",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        {videoVersion === "custom" ? "Custom" : "Ultra"} Version
      </button>

      {/* Debug info panel */}
      <div
        style={{
          position: "fixed",
          top: "110px",
          right: "10px",
          zIndex: 1000,
          backgroundColor: "rgba(0,0,0,0.8)",
          color: "white",
          padding: "10px",
          borderRadius: "4px",
          fontSize: "12px",
          maxWidth: "300px",
        }}
      >
        <div>
          <strong>Debug Info:</strong>
        </div>
        <div>Status: {connectionStatus}</div>
        <div>Token: {LKToken ? "Ready" : "Missing"}</div>
        <div>MyId: {myId || "Not set"}</div>
        <div>Room: {id || "Not set"}</div>
        <div>Stream: {myStream ? "Ready" : "Missing"}</div>
        <div>Server: {LIVEKIT_SERVER}</div>
        <div>Version: {videoVersion.toUpperCase()}</div>
      </div>

      {LKToken ? (
        <LiveKitRoom
          token={LKToken}
          serverUrl={LIVEKIT_SERVER}
          connect
          video
          audio={{
            echoCancellation: true,
            noiseSuppression: true,
          }}
          connectOptions={{
            autoSubscribe: true,
          }}
          onConnected={() => {
            console.log("GamePage: Successfully connected to LiveKit room");
            setConnectionStatus("Connected");
          }}
          onDisconnected={() => {
            console.log("GamePage: Disconnected from LiveKit room");
            setConnectionStatus("Disconnected");
          }}
          onError={(error) => {
            console.error("GamePage: LiveKit room error:", error);
            setConnectionStatus(`Error: ${error.message}`);
          }}
        >
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
