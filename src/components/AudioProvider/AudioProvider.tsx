import { reaction } from "mobx";
import { ReactNode, useEffect } from "react";

import { useNightAtmosphereAudio } from "@/hooks/useNightAtmosphereAudio.ts";
import { rootStore } from "@/store/rootStore.ts";
import { SoundEffect } from "@/store/soundStore.ts";

export const AudioProvider = ({ children }: { children: ReactNode }) => {
  const { gamesStore, soundStore, isIGM, usersStore } = rootStore;

  useNightAtmosphereAudio();

  useEffect(() => {
    const dayTracks = ["day_bg.mp3", "day_bg_1.mp3", "day_bg_2.mp3"];
    const nightTracks = ["night_bg.mp3", "night_bg_2.mp3", "night_bg_3.mp3"];

    // 1. Reaction: Day/Night music — only fires when state actually changes
    //    (no fireImmediately, so no sound on game entry)
    const disposeMusic = reaction(
      () => ({
        isNight: gamesStore.gameFlow.isNight,
        isStarted: gamesStore.gameFlow.isStarted,
        gameId: gamesStore.activeGameId,
      }),
      ({ isNight, isStarted, gameId }, prev) => {
        // Don't play anything if there's no active game
        if (!gameId) {
          soundStore.stopMusic();
          return;
        }

        // Stop music when game is restarted (isStarted becomes false)
        const gameStopped = !isStarted && prev?.isStarted;
        if (gameStopped) {
          soundStore.stopMusic();
          return;
        }

        // Only play transition sounds when isNight actually toggled — not on restart
        const nightToggled = isNight !== prev?.isNight;
        const gameJustStarted = isStarted && !prev?.isStarted;

        if (gameJustStarted) {
          // On first start only — play current phase music without transition sfx
          soundStore.playBgMusic(isNight ? nightTracks : dayTracks, true);
          return;
        }

        if (nightToggled) {
          if (isNight) {
            soundStore.playSfx(SoundEffect.NightStart, 0.75, 3000, 700);
            setTimeout(() => soundStore.playBgMusic(nightTracks, true), 1000);
          } else if (isStarted) {
            // Only play day music if game is actually running (not after restart)
            soundStore.playSfx(SoundEffect.DayStart);
            setTimeout(() => soundStore.playBgMusic(dayTracks, true), 1000);
          }
        }
      }
    );

    // 2. Reaction: Game events (deaths, connections)
    let prevPlayers = gamesStore.activeGamePlayers.slice();
    let prevKilledCount = gamesStore.activeGameKilledPlayers.length;

    const disposeGameEvents = reaction(
      () => ({
        killed: gamesStore.activeGameKilledPlayers.length,
        players: gamesStore.activeGamePlayers.slice(),
        gameId: gamesStore.activeGameId,
        isStarted: gamesStore.gameFlow.isStarted,
      }),
      (current) => {
        // Only inside an active game
        if (!current.gameId) return;

        // Death (only during active game)
        if (current.killed > prevKilledCount && current.isStarted) {
          soundStore.playSfx(SoundEffect.Killed, 1, 3000, 700);
        }
        prevKilledCount = current.killed;

        // New player join (only if it's not the current user or initial load)
        if (current.players.length > prevPlayers.length) {
          const newPlayers = current.players.filter(
            (p) => !prevPlayers.includes(p)
          );

          const amIJustJoined = newPlayers.includes(usersStore.myId!);
          const isInitialHydration = prevPlayers.length === 0;

          if (!amIJustJoined && !isInitialHydration && newPlayers.length > 0) {
            soundStore.playSfx(SoundEffect.Connect);
          }
        }
        prevPlayers = current.players;
      }
    );

    // 3. Reaction: Role-action sounds (server-confirmed)
    const disposeActions = reaction(
      () => ({
        block: gamesStore.gameFlow.prostituteBlock,
        save: gamesStore.gameFlow.doctorSave,
        sheriffCheck: gamesStore.gameFlow.sheriffCheck,
        donCheck: gamesStore.gameFlow.donCheck,
        gameId: gamesStore.activeGameId,
        isMeObserver: gamesStore.isMeObserver,
      }),
      (actions, prev) => {
        if (!actions.gameId) return;

        // Play sounds only for GM and Observers (players hear their own actions locally in GameVideo)
        const shouldHearAll = isIGM || actions.isMeObserver;

        if (actions.block && actions.block !== prev?.block && shouldHearAll) {
          soundStore.playSfx(SoundEffect.Kiss);
        }
        if (actions.save && actions.save !== prev?.save && shouldHearAll) {
          soundStore.playSfx(SoundEffect.Heal, 0.7);
        }
        if (
          actions.sheriffCheck &&
          actions.sheriffCheck !== prev?.sheriffCheck &&
          shouldHearAll
        ) {
          soundStore.playSfx(SoundEffect.Check);
        }
        if (
          actions.donCheck &&
          actions.donCheck !== prev?.donCheck &&
          shouldHearAll
        ) {
          soundStore.playSfx(SoundEffect.Check);
        }
      }
    );

    // Cleanup: stop all audio when leaving the game page
    return () => {
      disposeMusic();
      disposeGameEvents();
      disposeActions();
      soundStore.stopMusic();
    };
  }, [gamesStore, soundStore, isIGM, gamesStore.isMeObserver]);

  return <>{children}</>;
};
