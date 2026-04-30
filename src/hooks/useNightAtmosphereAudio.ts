import { reaction } from "mobx";
import { useEffect, useRef } from "react";

import { rootStore } from "@/store/rootStore.ts";
import { SoundEffect } from "@/store/soundStore.ts";
import { Roles } from "@/types/game.types.ts";
import { UserId } from "@/types/user.types.ts";

// ─── Timing constants ────────────────────────────────────────────────────────

/** Random delay range (ms) for fake sounds when the acting role player is alive. */
const ALIVE_ROLE_MIN_DELAY_MS = 1500;
const ALIVE_ROLE_MAX_DELAY_MS = 7000;

/** Compressed range used when all acting players are already dead (GM just role-plays the phase). */
const DEAD_ROLE_MIN_DELAY_MS = 300;
const DEAD_ROLE_MAX_DELAY_MS = 1500;

/** Minimum gap between consecutive fake shots/sounds (ms). */
const MIN_INTER_SOUND_GAP_MS = 500;

/** When flushing remaining sounds immediately (real action fired or wakeUp changed),
 *  stagger each remaining sound by this amount. */
const FLUSH_INTER_SOUND_GAP_MS = 200;

// ─── Types ───────────────────────────────────────────────────────────────────

type PendingPhase = {
  role: Roles;
  sound: SoundEffect;
  /** Volume multiplier for this role's fake sound. */
  volume: number;
  /** Total fake sounds to play this phase. */
  total: number;
  /** How many have already been played. */
  played: number;
  /** Whether the acting role's players are alive (affects shouldHear logic). */
  isRoleAlive: boolean;
  /** Active setTimeout handles — cancelled on flush. */
  timers: ReturnType<typeof setTimeout>[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const randomBetween = (min: number, max: number) =>
  Math.random() * (max - min) + min;

const toArray = (wakeUp: string | string[] | undefined): string[] => {
  if (!wakeUp) return [];
  return Array.isArray(wakeUp) ? wakeUp : [wakeUp];
};

interface DetectedPhase {
  role: Roles;
  sound: SoundEffect;
  volume: number;
  count: number;
  isRoleAlive: boolean;
}

interface ActiveRoles {
  mafia?: UserId[];
  sheriff?: UserId;
  citizens?: UserId[];
  doctor?: UserId;
  maniac?: UserId;
  prostitute?: UserId;
  don?: UserId;
}

/**
 * Determines which role group just woke up and what fake sound to use.
 * Returns null if the wakeUp set doesn't match any known night role.
 *
 * Corner case — solo Don (mafia.length === 1):
 *   The Don wakes up twice: first to shoot (wakeUp = [don], shootCount === 0),
 *   then to check (wakeUp = [don] again, shootCount > 0). We pass shootCount to
 *   distinguish these two phases so the correct fake sound is scheduled.
 */
const detectWakeUpRole = (
  wakeUpIds: string[],
  killed: string[],
  roles: ActiveRoles | null,
  shootCount: number
): DetectedPhase | null => {
  if (!roles || wakeUpIds.length === 0) return null;

  const { mafia = [], sheriff, prostitute, doctor, don } = roles;

  const isRoleAlive = (ids: string[]) => ids.some((id) => !killed.includes(id));

  // Mafia group: wakeUp contains ≥1 mafia ID and the set size > 1
  // (GM wakes ALL mafia at once for multi-mafia games)
  const mafiaInWakeUp = wakeUpIds.filter((id) => mafia.includes(id));
  if (mafiaInWakeUp.length > 0 && wakeUpIds.length > 1) {
    return {
      role: Roles.Mafia,
      sound: SoundEffect.Shot,
      volume: 0.75,
      // Always use the initial total mafia count, not current alive count
      count: mafia.length,
      isRoleAlive: isRoleAlive(mafia),
    };
  }

  if (wakeUpIds.length === 1) {
    const [id] = wakeUpIds;

    if (id === don) {
      // Solo Don corner case: if he's the only mafia member, he wakes up once to
      // shoot and once to check. Use shootCount to tell the phases apart.
      const isSoloDon = mafia.length === 1;
      const isShootPhase = isSoloDon && shootCount === 0;

      if (isShootPhase) {
        return {
          role: Roles.Mafia,
          sound: SoundEffect.Shot,
          volume: 0.75,
          count: 1,
          isRoleAlive: !killed.includes(id),
        };
      }

      return {
        role: Roles.Don,
        sound: SoundEffect.Check,
        volume: 0.6,
        count: 1,
        isRoleAlive: !killed.includes(id),
      };
    }

    if (id === sheriff) {
      return {
        role: Roles.Sheriff,
        sound: SoundEffect.Check,
        volume: 0.6,
        count: 1,
        isRoleAlive: !killed.includes(id),
      };
    }

    if (id === prostitute) {
      return {
        role: Roles.Prostitute,
        sound: SoundEffect.Kiss,
        volume: 0.6,
        count: 1,
        isRoleAlive: !killed.includes(id),
      };
    }

    if (id === doctor) {
      return {
        role: Roles.Doctor,
        sound: SoundEffect.Heal,
        volume: 0.6,
        count: 1,
        isRoleAlive: !killed.includes(id),
      };
    }
  }

  return null;
};

/**
 * Generates sorted random delays for `count` fake sounds.
 * Each delay is independent; a minimum gap is enforced between consecutive sounds.
 */
const generateDelays = (
  count: number,
  minMs: number,
  maxMs: number
): number[] => {
  const raw = Array.from({ length: count }, () => randomBetween(minMs, maxMs));
  raw.sort((a, b) => a - b);

  // Enforce minimum gap between consecutive sounds
  for (let i = 1; i < raw.length; i++) {
    if (raw[i] - raw[i - 1] < MIN_INTER_SOUND_GAP_MS) {
      raw[i] = raw[i - 1] + MIN_INTER_SOUND_GAP_MS;
    }
  }

  return raw;
};

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Plays randomized imitation sounds for sleeping players during the night phase.
 *
 * Rules:
 * - When a role group wakes up, schedule N fake sounds at random delays.
 * - If the real action fires before a timer → cancel pending timers and play
 *   remaining sounds immediately (staggered by FLUSH_INTER_SOUND_GAP_MS).
 * - If wakeUp changes (GM moves to next role) → same flush behaviour.
 * - Alive role acting → fake sounds for: !isIGM && !isMeObserver && !isIWakedUp
 * - Dead role acting → fake sounds for everyone (!isIWakedUp), including GM/observers,
 *   because there will be no real action to observe.
 */
export const useNightAtmosphereAudio = () => {
  const phaseRef = useRef<PendingPhase | null>(null);

  useEffect(() => {
    const { gamesStore, soundStore, isIGM } = rootStore;

    // ── Helpers that read live store state ───────────────────────────────────

    const shouldHearFakeSounds = (isRoleAlive: boolean): boolean => {
      const { isMeObserver } = gamesStore;
      const { isIWakedUp } = rootStore;

      if (isRoleAlive) {
        // Only sleeping players (alive and dead non-observers)
        return !isIGM && !isMeObserver && !isIWakedUp;
      }

      // Dead role acting: everyone hears the fake (no real sound will happen)
      return !isIWakedUp;
    };

    const playFakeSound = (
      sound: SoundEffect,
      volume: number,
      isRoleAlive: boolean
    ) => {
      if (!shouldHearFakeSounds(isRoleAlive)) return;
      soundStore.playSfx(sound, volume);
    };

    // ── Flush: fire all remaining unplayed sounds quickly ────────────────────

    const flushPhase = () => {
      const phase = phaseRef.current;
      if (!phase) return;

      phase.timers.forEach(clearTimeout);
      phase.timers.length = 0;

      const remaining = phase.total - phase.played;

      for (let i = 0; i < remaining; i++) {
        const { sound, volume, isRoleAlive } = phase;
        setTimeout(() => {
          playFakeSound(sound, volume, isRoleAlive);
        }, i * FLUSH_INTER_SOUND_GAP_MS);
      }

      phaseRef.current = null;
    };

    // ── Schedule fake sounds for a newly detected phase ──────────────────────

    const schedulePhase = (detected: DetectedPhase) => {
      const { role, sound, volume, count, isRoleAlive } = detected;

      const minDelay = isRoleAlive
        ? ALIVE_ROLE_MIN_DELAY_MS
        : DEAD_ROLE_MIN_DELAY_MS;
      const maxDelay = isRoleAlive
        ? ALIVE_ROLE_MAX_DELAY_MS
        : DEAD_ROLE_MAX_DELAY_MS;

      const delays = generateDelays(count, minDelay, maxDelay);

      const phase: PendingPhase = {
        role,
        sound,
        volume,
        total: count,
        played: 0,
        isRoleAlive,
        timers: [],
      };

      for (const delay of delays) {
        const timer = setTimeout(() => {
          playFakeSound(sound, volume, isRoleAlive);
          phase.played += 1;

          if (phase.played >= phase.total) {
            phaseRef.current = null;
          }
        }, delay);

        phase.timers.push(timer);
      }

      phaseRef.current = phase;
    };

    // ── MobX reaction ────────────────────────────────────────────────────────

    let prevWakeUpSerialized = "";
    let prevShootCount = 0;
    let prevDoctorSave = "";
    let prevProstituteBlock = "";
    let prevSheriffCheck = "";
    let prevDonCheck = "";

    const dispose = reaction(
      () => {
        const { gameFlow, activeGameKilledPlayers } = gamesStore;
        const wakeUpArr = toArray(gameFlow.wakeUp as string | string[]);

        return {
          wakeUpSerialized: [...wakeUpArr].sort().join(","),
          wakeUpArr,
          shootCount: Object.keys(gameFlow.shoot ?? {}).length,
          doctorSave: gameFlow.doctorSave ?? "",
          prostituteBlock: gameFlow.prostituteBlock ?? "",
          sheriffCheck: gameFlow.sheriffCheck ?? "",
          donCheck: gameFlow.donCheck ?? "",
          isNight: gameFlow.isNight,
          killed: activeGameKilledPlayers.slice(),
        };
      },
      (current) => {
        // ── Night ended → clear everything ───────────────────────────────────
        if (!current.isNight) {
          flushPhase();
          prevWakeUpSerialized = "";
          prevShootCount = 0;
          prevDoctorSave = "";
          prevProstituteBlock = "";
          prevSheriffCheck = "";
          prevDonCheck = "";
          return;
        }

        const wakeUpChanged = current.wakeUpSerialized !== prevWakeUpSerialized;

        // ── Detect real action for current phase → flush remaining sounds ────
        if (phaseRef.current && !wakeUpChanged) {
          const { role } = phaseRef.current;
          let actionFired = false;

          if (role === Roles.Mafia && current.shootCount > prevShootCount) {
            actionFired = true;
          } else if (
            role === Roles.Doctor &&
            current.doctorSave &&
            current.doctorSave !== prevDoctorSave
          ) {
            actionFired = true;
          } else if (
            role === Roles.Prostitute &&
            current.prostituteBlock &&
            current.prostituteBlock !== prevProstituteBlock
          ) {
            actionFired = true;
          } else if (
            role === Roles.Sheriff &&
            current.sheriffCheck &&
            current.sheriffCheck !== prevSheriffCheck
          ) {
            actionFired = true;
          } else if (
            role === Roles.Don &&
            current.donCheck &&
            current.donCheck !== prevDonCheck
          ) {
            actionFired = true;
          }

          if (actionFired) {
            flushPhase();

            // Solo Don corner case: after the real shot fires, the Don stays awake
            // for his check phase. wakeUp doesn't change between the two phases,
            // so we must re-detect with the updated shootCount to start the check phase.
            if (role === Roles.Mafia && current.wakeUpArr.length === 1) {
              const reDetected = detectWakeUpRole(
                current.wakeUpArr,
                current.killed,
                gamesStore.activeGameRoles,
                current.shootCount
              );

              if (reDetected?.role === Roles.Don) {
                schedulePhase(reDetected);
              }
            }
          }
        }

        // ── Solo Don: shoot→check transition (phaseRef may already be null) ────
        // The fake shot may have played out naturally before the real shot fired,
        // leaving phaseRef.current === null. The block above only runs when phaseRef
        // is active, so we also need this standalone check.
        const shotJustFired = current.shootCount > prevShootCount;
        if (!wakeUpChanged && shotJustFired && current.wakeUpArr.length === 1 && !phaseRef.current) {
          const reDetected = detectWakeUpRole(
            current.wakeUpArr,
            current.killed,
            gamesStore.activeGameRoles,
            current.shootCount
          );

          if (reDetected?.role === Roles.Don) {
            schedulePhase(reDetected);
          }
        }

        // ── wakeUp changed → flush previous phase, start new one ─────────────
        if (wakeUpChanged) {
          flushPhase();

          const detected = detectWakeUpRole(
            current.wakeUpArr,
            current.killed,
            gamesStore.activeGameRoles,
            current.shootCount
          );

          if (detected) {
            schedulePhase(detected);
          }

          prevWakeUpSerialized = current.wakeUpSerialized;
        }

        // Track previous action values for next reaction run
        prevShootCount = current.shootCount;
        prevDoctorSave = current.doctorSave;
        prevProstituteBlock = current.prostituteBlock;
        prevSheriffCheck = current.sheriffCheck;
        prevDonCheck = current.donCheck;
      }
    );

    return () => {
      dispose();
      flushPhase();
    };
    // isIGM is a computed value that lives on rootStore and is stable per game session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
