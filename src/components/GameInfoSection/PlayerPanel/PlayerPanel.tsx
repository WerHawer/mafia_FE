import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PlayerPanelInfo } from "@/components/GameInfoSection/PlayerPanel/PlayerPanelInfo.tsx";
import { rootStore } from "@/store/rootStore.ts";
import { Roles } from "@/types/game.types.ts";

import { RoleCard } from "../../RoleCard/RoleCard.tsx";
import { playerCardAnimation } from "../config.ts";
import { DealingAnimation } from "../DealingAnimation.tsx";
import styles from "./PlayerPanel.module.scss";

export const PlayerPanel = observer(() => {
  const { gamesStore, usersStore, myRole } = rootStore;
  const { gameFlow, activeGameRoles } = gamesStore;
  const { isStarted, isNight } = gameFlow;
  const { myId } = usersStore;
  const [shouldShowDeck, setShouldShowDeck] = useState(true);
  const [isUserKnowRole, setIsUserKnowRole] = useState(false);

  useEffect(() => {
    if (!isStarted) {
      setShouldShowDeck(true);
      setIsUserKnowRole(false);

      return;
    }

    const timer = setTimeout(() => {
      setShouldShowDeck(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [isStarted]);

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
    setIsUserKnowRole(true);
  }, []);

  return (
    <div className={styles.playerPanel}>
      {myRole && isStarted ? (
        <motion.div
          className={styles.roleCardContainer}
          {...playerCardAnimation}
        >
          <RoleCard
            role={myRole}
            width={100}
            height={150}
            index={roleIndex}
            onClick={onCardClick}
          />
        </motion.div>
      ) : null}

      {!isStarted ? <p>Waiting for start...</p> : null}

      {isStarted && shouldShowDeck ? <DealingAnimation /> : null}

      {isStarted && isUserKnowRole ? <PlayerPanelInfo /> : null}
    </div>
  );
});
