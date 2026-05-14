import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useShuffledRoleImages } from "@/hooks/useShuffledRoleImages.ts";
import { rootStore } from "@/store/rootStore.ts";
import { Roles } from "@/types/game.types.ts";
import { Typography } from "@/UI/Typography";

import styles from "./GameVideo.module.scss";

type RoleCardMiniProps = {
  userId: string;
  role: Roles;
};

export const RoleCardMini = observer(({ userId, role }: RoleCardMiniProps) => {
  const { gamesStore } = rootStore;
  const { gameFlow } = gamesStore;
  const { t } = useTranslation();

  const isVisible = gameFlow.isPostGame || gamesStore.isMeObserver;

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

  const { getRoleImages } = useShuffledRoleImages();
  const image = getRoleImages(cardIndex)[role];

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
