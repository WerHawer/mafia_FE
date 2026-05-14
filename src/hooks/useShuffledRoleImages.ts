import { useMemo } from "react";

import barista from "@/assets/images/cards/barista.webp";
import barmen from "@/assets/images/cards/barmen.webp";
import cardBack from "@/assets/images/cards/card_back.webp";
import cook from "@/assets/images/cards/cook.webp";
import doctor from "@/assets/images/cards/doctor.webp";
import don from "@/assets/images/cards/don.webp";
import flower_lady from "@/assets/images/cards/flower_ledy.webp";
import girl from "@/assets/images/cards/girl.webp";
import granny from "@/assets/images/cards/granny.webp";
import it from "@/assets/images/cards/it.webp";
import mafia_1 from "@/assets/images/cards/mafia_1.webp";
import mafia_2 from "@/assets/images/cards/mafia_2.webp";
import mama from "@/assets/images/cards/mama.webp";
import musician from "@/assets/images/cards/musician.webp";
import office from "@/assets/images/cards/office.webp";
import photographer from "@/assets/images/cards/photographer.webp";
import plumer from "@/assets/images/cards/plumer.webp";
import prostitute from "@/assets/images/cards/prostitute.webp";
import runner from "@/assets/images/cards/runner.webp";
import sheriff from "@/assets/images/cards/sheriff.webp";
import taxi from "@/assets/images/cards/taxi.webp";
import waitress from "@/assets/images/cards/waitress.webp";
import { shuffleArrayWithSeed } from "@/helpers/roleCards.ts";
import { rootStore } from "@/store/rootStore.ts";
import { Roles } from "@/types/game.types.ts";

const CITIZEN_IMAGES = [
  barista,
  barmen,
  cook,
  flower_lady,
  girl,
  granny,
  it,
  mama,
  musician,
  office,
  photographer,
  plumer,
  runner,
  taxi,
  waitress,
];
const MAFIA_IMAGES = [don, mafia_1, mafia_2];

export type RoleImages = Record<string, string>;

type UseShuffledRoleImagesResult = {
  /** Citizen images shuffled deterministically per game session */
  shuffledCitizens: string[];
  /** Mafia images (don is always index 0) */
  mafiaImages: string[];
  cardBack: string;
  /** Pre-built role → image map; pass index for citizen/mafia variation */
  getRoleImages: (index?: number) => RoleImages;
};

/**
 * Returns role card images with citizens shuffled deterministically based on the
 * active game seed (gameId + startTime), so every player sees the same card art.
 */
export const useShuffledRoleImages = (): UseShuffledRoleImagesResult => {
  const { gamesStore } = rootStore;

  const seed = `${gamesStore.activeGameId}-${gamesStore.activeGame?.startTime ?? 0}`;

  const shuffledCitizens = useMemo(
    () => shuffleArrayWithSeed(CITIZEN_IMAGES, seed),
    [seed]
  );

  const getRoleImages = (index: number = 0): RoleImages => ({
    [Roles.Don]: don,
    [Roles.Sheriff]: sheriff,
    [Roles.Doctor]: doctor,
    [Roles.Prostitute]: prostitute,
    [Roles.Mafia]: MAFIA_IMAGES[index % MAFIA_IMAGES.length],
    [Roles.Citizen]: shuffledCitizens[index % shuffledCitizens.length],
  });

  return {
    shuffledCitizens,
    mafiaImages: MAFIA_IMAGES,
    cardBack,
    getRoleImages,
  };
};
