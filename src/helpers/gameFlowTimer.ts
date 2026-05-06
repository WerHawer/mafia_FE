import { IGameFlow } from "@/types/game.types.ts";

/**
 * Unified `timerStartedAt` (BE): one active countdown at a time — speech, vote defense, or voting.
 */

/** Seconds for the speaker slot (normal vs candidate / extra). */
export const getSpeakerSlotDurationSec = (flow: IGameFlow): number =>
  flow.isExtraSpeech || flow.isReVote
    ? flow.candidateSpeakTime
    : flow.speakTime;

/** Absolute Unix ms when the speaker timer should hit zero; undefined → FE uses full duration from `time`. */
export const getSpeakerTimerServerEndMs = (
  flow: IGameFlow
): number | undefined => {
  const { speaker, timerStartedAt } = flow;

  if (!speaker || timerStartedAt == null) {

    return undefined;
  }

  const durationSec = getSpeakerSlotDurationSec(flow);

  return timerStartedAt + durationSec * 1000;
};

/** Voting countdown end; undefined → full `votesTime` countdown locally. */
export const getVoteTimerServerEndMs = (
  flow: IGameFlow
): number | undefined => {
  const { isVote, votesTime, timerStartedAt } = flow;

  if (!isVote || timerStartedAt == null) {

    return undefined;
  }

  return timerStartedAt + votesTime * 1000;
};
