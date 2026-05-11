import { UserId } from "@/types/user.types.ts";

export type ExpectedVideoParticipantsParams = {
  myId: UserId | null | undefined;
  isGameStarted: boolean;
  shouldShowMyVideo: boolean;
  shouldShowPlayerVideo: (participantId: UserId) => boolean;
  activeGamePlayers: UserId[];
  activeGameGm: UserId | undefined;
  /** When true (layout stress-test), skip visibility health logic */
  mockStreamsEnabled: boolean;
};

export type ExpectedVideoParticipantsResult = {
  expectLocalCamera: boolean;
  expectedRemoteIds: Set<UserId>;
};

/**
 * Same rules as {@link VideoGrid} filter + night visibility: who should have a visible
 * camera tile for this client. Used to compare against LiveKit subscriptions, not UI.
 */
export const getExpectedCameraIdentities = (
  params: ExpectedVideoParticipantsParams
): ExpectedVideoParticipantsResult => {
  const {
    myId,
    isGameStarted,
    shouldShowMyVideo,
    shouldShowPlayerVideo,
    activeGamePlayers,
    activeGameGm,
    mockStreamsEnabled,
  } = params;

  if (mockStreamsEnabled) {

    return { expectLocalCamera: false, expectedRemoteIds: new Set() };
  }

  const roster: UserId[] = [...activeGamePlayers];

  if (activeGameGm && !roster.includes(activeGameGm)) {
    roster.push(activeGameGm);
  }

  const expectedRemoteIds = new Set<UserId>();

  for (const participantId of roster) {
    if (!myId || participantId === myId) continue;

    if (!isGameStarted || shouldShowPlayerVideo(participantId)) {
      expectedRemoteIds.add(participantId);
    }
  }

  const expectLocalCamera =
    Boolean(myId) &&
    (!isGameStarted || shouldShowMyVideo);

  return { expectLocalCamera, expectedRemoteIds };
};
