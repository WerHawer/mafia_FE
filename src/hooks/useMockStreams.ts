import { useTracks } from "@livekit/components-react";
import { Participant, Track } from "livekit-client";
import { useCallback, useMemo, useState } from "react";

import { rootStore } from "@/store/rootStore.ts";
import { UserId } from "@/types/user.types.ts";

// Create a mock participant object that implements the basic Participant interface
const createMockParticipant = (identity: string, name: string): Participant => {
  return {
    identity,
    name,
    sid: `mock_${identity}`,
    isLocal: false,
    connectionQuality: "excellent",
    isSpeaking: false,
    audioLevel: 0,
    permissions: {},
    metadata: "",
    joinedAt: new Date(),
    // Add minimal required methods and properties
    getTrackPublication: () => undefined,
    getTrackPublications: () => [],
    getTracks: () => [],
    isCameraEnabled: () => false,
    isMicrophoneEnabled: () => false,
    isScreenShareEnabled: () => false,
    // Add event emitter methods
    on: () => {},
    off: () => {},
    emit: () => false,
    addListener: () => {},
    removeListener: () => {},
    removeAllListeners: () => {},
  } as unknown as Participant;
};

export const useMockStreams = () => {
  const { usersStore, gamesStore } = rootStore;
  const { myId, getUser } = usersStore;
  const { activeGamePlayers } = gamesStore;
  const tracks = useTracks([Track.Source.Camera]);
  const [mockStreamsEnabled, setMockStreamsEnabled] = useState(false);

  // Find my current track for cloning
  const myTrack = useMemo(() => {
    return tracks.find((trackRef) => trackRef.participant?.isLocal)?.publication
      ?.track;
  }, [tracks]);

  // Create mock participants based on activeGamePlayers
  const mockTracks = useMemo(() => {
    if (!mockStreamsEnabled || !myTrack || !activeGamePlayers.length) {
      return [];
    }

    return activeGamePlayers
      .filter((playerId) => playerId !== myId) // Exclude myself
      .map((playerId: UserId) => {
        const user = getUser(playerId);

        // Create a mock participant that works with GameVideo component
        const mockParticipant = createMockParticipant(
          playerId,
          user?.nikName || `Player ${playerId.slice(-4)}`
        );

        return {
          participant: mockParticipant,
          publication: {
            track: myTrack, // Use my video track for all mock streams
            source: Track.Source.Camera,
            kind: Track.Kind.Video,
            trackSid: `mock_${playerId}_track`,
            trackName: `mock_${playerId}_camera`,
          },
          source: Track.Source.Camera,
        };
      });
  }, [mockStreamsEnabled, myTrack, activeGamePlayers, myId, getUser]);

  // Combine real tracks with mock tracks
  const allTracks = useMemo(() => {
    return mockStreamsEnabled ? [...tracks, ...mockTracks] : tracks;
  }, [tracks, mockTracks, mockStreamsEnabled]);

  const handleToggleMockStreams = useCallback(() => {
    if (!activeGamePlayers.length) {
      console.log("No active game players found");
      return;
    }

    const newMockState = !mockStreamsEnabled;
    setMockStreamsEnabled(newMockState);

    console.log(
      newMockState
        ? `Created ${activeGamePlayers.length - 1} mock streams based on activeGamePlayers`
        : "Disabled mock streams"
    );
    console.log("Active players:", activeGamePlayers);
  }, [activeGamePlayers, mockStreamsEnabled]);

  return {
    mockStreamsEnabled,
    allTracks,
    streamsLength: allTracks.length,
    handleToggleMockStreams,
    myTrack,
  };
};
