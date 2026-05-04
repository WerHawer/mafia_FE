import { motion } from "framer-motion";
import { useEffect } from "react";

import { rootStore } from "@/store/rootStore.ts";
import { SoundEffect } from "@/store/soundStore.ts";
import { Roles } from "@/types/game.types";

import { RoleCard } from "../RoleCard/RoleCard";
import {
  CARDS_COUNT,
  CARDS_DELAY,
  INITIAL_DELAY,
  getFakeCardAnimation,
} from "./config";
import styles from "./GameInfoSection.module.scss";

export const DealingAnimation = () => {
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    Array.from({ length: CARDS_COUNT }).forEach((_, index) => {
      // Fire sound at the moment each card 'lands' — same delay as the animation
      const delayMs = (INITIAL_DELAY + index * CARDS_DELAY) * 1000;
      const timer = setTimeout(() => {
        rootStore.soundStore.playSfx(SoundEffect.Deal);
      }, delayMs);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

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
