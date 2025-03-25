import { Roles } from "@/types/game.types";
import { motion } from "framer-motion";
import { RoleCard } from "../RoleCard/RoleCard";
import styles from "./GameInfoSection.module.scss";
import { CARDS_COUNT, getFakeCardAnimation } from "./config";

export const DealingAnimation = () => {
  return (
    <>
      {Array.from({ length: CARDS_COUNT }).map((_, index) => {
        const targetX = -50 + (110 / (CARDS_COUNT - 1)) * index;
        const targetY = 10;
        const rotation = Math.random() * 360 - 180;

        return (
          <motion.div
            key={index}
            className={styles.fakeCard}
            {...getFakeCardAnimation(index, targetX, targetY, rotation)}
          >
            <RoleCard role={Roles.Citizen} width={100} height={150} index={0} />
          </motion.div>
        );
      })}
    </>
  );
};
