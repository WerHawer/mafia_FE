import { reaction } from "mobx";
import { ReactNode, useEffect } from "react";

import { rootStore } from "@/store/rootStore.ts";
import { SoundEffect } from "@/store/soundStore.ts";

export const AudioProvider = ({ children }: { children: ReactNode }) => {
  const { gamesStore, soundStore, isIGM } = rootStore;

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
          soundStore.playMusic(isNight ? nightTracks : dayTracks);
          return;
        }

        if (nightToggled) {
          if (isNight) {
            soundStore.playSfx(SoundEffect.NightStart, 0.8, 3000);
            setTimeout(() => soundStore.playMusic(nightTracks), 1000);
          } else if (isStarted) {
            // Only play day music if game is actually running (not after restart)
            soundStore.playSfx(SoundEffect.DayStart);
            setTimeout(() => soundStore.playMusic(dayTracks), 1000);
          }
        }
      }
    );

    // 2. Reaction: Game events (deaths, connections)
    let prevPlayersCount = gamesStore.activeGamePlayers.length;
    let prevKilledCount = gamesStore.activeGameKilledPlayers.length;

    const disposeGameEvents = reaction(
      () => ({
        killed: gamesStore.activeGameKilledPlayers.length,
        players: gamesStore.activeGamePlayers.length,
        gameId: gamesStore.activeGameId,
        isStarted: gamesStore.gameFlow.isStarted,
      }),
      (current) => {
        // Only inside an active game
        if (!current.gameId) return;

        // Death (only during active game)
        if (current.killed > prevKilledCount && current.isStarted) {
          soundStore.playSfx(SoundEffect.Killed);
        }
        prevKilledCount = current.killed;

        // New player join
        if (current.players > prevPlayersCount) {
          soundStore.playSfx(SoundEffect.Connect);
        }
        prevPlayersCount = current.players;
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
      }),
      (actions, prev) => {
        if (!actions.gameId) return;

        // Play sounds only for GM (players hear their own actions locally in GameVideo)
        if (actions.block && actions.block !== prev?.block && isIGM) {
          soundStore.playSfx(SoundEffect.Kiss);
        }
        if (actions.save && actions.save !== prev?.save && isIGM) {
          soundStore.playSfx(SoundEffect.Heal);
        }
        if (
          actions.sheriffCheck &&
          actions.sheriffCheck !== prev?.sheriffCheck &&
          isIGM
        ) {
          soundStore.playSfx(SoundEffect.Check);
        }
        if (actions.donCheck && actions.donCheck !== prev?.donCheck && isIGM) {
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
  }, [gamesStore, soundStore, isIGM]);

  return <>{children}</>;
};
