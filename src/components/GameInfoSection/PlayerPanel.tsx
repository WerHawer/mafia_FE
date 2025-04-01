import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";

import { rootStore } from "@/store/rootStore.ts";
import { Roles } from "@/types/game.types";

import { RoleCard } from "../RoleCard/RoleCard";
import { playerCardAnimation } from "./config";
import { DealingAnimation } from "./DealingAnimation";
import styles from "./GameInfoSection.module.scss";

export const PlayerPanel = observer(() => {
  const { gamesStore, usersStore, myRole } = rootStore;
  const { gameFlow, activeGameRoles } = gamesStore;
  const { myId } = usersStore;

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

  return (
    <div className={styles.playerPanel}>
      {myRole && gameFlow.isStarted ? (
        <motion.div
          className={styles.roleCardContainer}
          {...playerCardAnimation}
        >
          <RoleCard role={myRole} width={100} height={150} index={roleIndex} />
        </motion.div>
      ) : null}

      {gameFlow.isStarted ? <DealingAnimation /> : null}

      {gameFlow.isNight ? <p>Night</p> : <p>Day</p>}
    </div>
  );
});
