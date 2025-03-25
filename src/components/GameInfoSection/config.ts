export const CARDS_COUNT = 9;
export const ANIMATION_DURATION = 0.4;
export const CARDS_DELAY = 0.2;
export const TOTAL_ANIMATION_TIME =
  ANIMATION_DURATION + (CARDS_COUNT - 1) * CARDS_DELAY;

export const playerCardAnimation = {
  initial: {
    x: "-60vw",
    y: "100vh",
    opacity: 0.4,
    scale: 1.2,
    rotate: -180,
  },
  animate: {
    x: 0,
    y: 0,
    opacity: 1,
    scale: 1,
    rotate: 360,
  },
  transition: {
    duration: 0.6,
    delay: TOTAL_ANIMATION_TIME,
    ease: "easeOut",
  },
};

export const getFakeCardAnimation = (
  index: number,
  targetX: number,
  targetY: number,
  rotation: number
) => ({
  initial: {
    x: 0,
    y: "100vh",
    opacity: 1,
    rotate: 0,
  },
  animate: {
    x: `${targetX}vw`,
    y: `${targetY}vh`,
    rotate: rotation,
    opacity: [1, 1, 1, 0],
  },
  transition: {
    duration: ANIMATION_DURATION,
    delay: 0.1 + index * CARDS_DELAY,
    ease: "easeOut",
    rotate: {
      type: "spring",
      stiffness: 50,
      damping: 10,
    },
  },
});
