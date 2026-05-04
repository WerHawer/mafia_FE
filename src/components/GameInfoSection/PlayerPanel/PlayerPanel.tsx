import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo } from "react";

import { PlayerPanelInfo } from "@/components/GameInfoSection/PlayerPanel/PlayerPanelInfo.tsx";
import { PlayerDashboardGrid } from "@/components/GameInfoSection/PlayerPanel/PlayerDashboardGrid.tsx";
import { rootStore } from "@/store/rootStore.ts";
import { Roles } from "@/types/game.types.ts";

import { RoleCard } from "../../RoleCard/RoleCard.tsx";
import { playerCardAnimation, staticCardAnimation } from "../config.ts";
import { DealingAnimation } from "../DealingAnimation.tsx";
import styles from "./PlayerPanel.module.scss";

export const PlayerPanel = observer(() => {
  const { gamesStore, usersStore, myRole } = rootStore;
  const { gameFlow, activeGameRoles, isDealingComplete, isRoleRevealed } =
    gamesStore;
  const { isStarted } = gameFlow;
  const { myId } = usersStore;

  useEffect(() => {
    if (!isStarted) {
      // Game reset — clear persisted UI flags
      gamesStore.isDealingComplete = false;
      gamesStore.isRoleRevealed = false;
      return;
    }

    // If dealing already completed in this session, skip the timer
    if (isDealingComplete) return;

    const timer = setTimeout(() => {
      gamesStore.isDealingComplete = true;
    }, 5000);

    return () => clearTimeout(timer);
  }, [isStarted, isDealingComplete, gamesStore]);

  const roleIndex = useMemo(() => {
    if (myRole === Roles.Citizen) {
      return activeGameRoles?.[Roles.Citizen]?.findIndex(
        (role) => role === myId
      );
    }

    if (myRole === Roles.Mafia) {
      return activeGameRoles?.[Roles.Mafia]?.findIndex((role) => role === myId);
    }
  }, [activeGameRoles, myId, myRole]);

  const onCardClick = useCallback(() => {
    gamesStore.isRoleRevealed = true;
  }, [gamesStore]);

  return (
    <div className={styles.playerPanel}>
      {myRole && isStarted ? (
        <motion.div
          className={styles.roleCardContainer}
          {...(isDealingComplete ? staticCardAnimation : playerCardAnimation)}
        >
          <RoleCard
            role={myRole}
            width={100}
            height={150}
            index={roleIndex}
            initialFlipped={isRoleRevealed}
            onClick={onCardClick}
          />
        </motion.div>
      ) : null}

      {!isStarted ? <p>Waiting for start...</p> : null}

      {isStarted && !isDealingComplete ? <DealingAnimation /> : null}

      {isStarted && isRoleRevealed ? (
        <div className={styles.panelContent}>
          <PlayerPanelInfo />
          <PlayerDashboardGrid />
        </div>
      ) : null}
    </div>
  );
});
