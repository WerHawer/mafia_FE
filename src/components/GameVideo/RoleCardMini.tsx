import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import anna from "@/assets/images/cards/anna.webp";
import doctor from "@/assets/images/cards/doctor.webp";
import janna from "@/assets/images/cards/janna.webp";
import kate from "@/assets/images/cards/kate.webp";
import ken from "@/assets/images/cards/ken.webp";
import mafia_1 from "@/assets/images/cards/mafia_1.webp";
import mafia_2 from "@/assets/images/cards/mafia_2.webp";
import don from "@/assets/images/cards/mafia_don.webp";
import prostitute from "@/assets/images/cards/prostitute.webp";
import sheriff from "@/assets/images/cards/sheriff.webp";
import taras from "@/assets/images/cards/taras.webp";
import vasyl from "@/assets/images/cards/vasyl.webp";
import { rootStore } from "@/store/rootStore.ts";
import { Roles } from "@/types/game.types.ts";
import { Typography } from "@/UI/Typography";

import styles from "./GameVideo.module.scss";

type RoleCardMiniProps = {
  userId: string;
  role: Roles;
};

export const RoleCardMini = observer(({ userId, role }: RoleCardMiniProps) => {
  const { gamesStore, isIGM, isIDead } = rootStore;
  const { gameFlow } = gamesStore;
  const { t } = useTranslation();

  // Determine if the card should be visible to the current user
  // Visible if: game ended, current user is observer, current user is GM, or current user is dead (spirit)
  const isVisible =
    gameFlow.isPostGame || gamesStore.isMeObserver || isIGM || isIDead;

  // Derive index for character variation (citizens/mafia) from game roles state
  const cardIndex = useMemo(() => {
    const roles = gamesStore.activeGameRoles;
    if (!roles) return 0;

    if (role === Roles.Citizen) {
      return roles.citizens?.indexOf(userId) ?? 0;
    }
    if (role === Roles.Mafia) {
      return roles.mafia?.indexOf(userId) ?? 0;
    }
    return 0;
  }, [gamesStore.activeGameRoles, role, userId]);

  const mafiaImages = [don, mafia_1, mafia_2];
  const citizenImages = [anna, janna, kate, ken, taras, vasyl];

  const roleImages: Record<string, string> = {
    [Roles.Don]: don,
    [Roles.Sheriff]: sheriff,
    [Roles.Doctor]: doctor,
    [Roles.Mafia]: mafiaImages[cardIndex % mafiaImages.length],
    [Roles.Citizen]: citizenImages[cardIndex % citizenImages.length],
    [Roles.Prostitute]: prostitute,
  };

  const image = roleImages[role];

  if (!isVisible || !image || role === Roles.GM || role === Roles.Unknown)
    return null;

  return (
    <div className={styles.roleCardContainer}>
      <img src={image} alt={role} />
      <Typography variant="subtitle" className={styles.roleNameMini}>
        {t(`roles.${role}`)}
      </Typography>
    </div>
  );
});

RoleCardMini.displayName = "RoleCardMini";
