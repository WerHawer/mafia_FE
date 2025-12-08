export const CARDS_COUNT = 9;
export const ANIMATION_DURATION = 0.4;
export const CARDS_DELAY = 0.2;
export const DECK_APPEAR_DURATION = 0.4;
export const DECK_PAUSE = 0.2;
export const INITIAL_DELAY = DECK_APPEAR_DURATION + DECK_PAUSE;
export const TOTAL_ANIMATION_TIME =
  ANIMATION_DURATION + (CARDS_COUNT - 1) * CARDS_DELAY + INITIAL_DELAY;

export const playerCardAnimation = {
  initial: {
    x: "-90vw",
    y: "200vh",
    opacity: 0.4,
    scale: 1.2,
    rotate: -180,
  },
  animate: {
    x: "100px",
    y: 0,
    opacity: 1,
    scale: 1,
    rotate: 387,
  },
  transition: {
    duration: 1,
    delay: TOTAL_ANIMATION_TIME - INITIAL_DELAY - CARDS_DELAY * 2,
    ease: "easeOut",
  },
};

export const getFakeCardAnimation = (
  index: number,
  targetX: number,
  targetY: number,
  rotation: number
) => {
  const cardDelay = index * CARDS_DELAY;
  const appearDuration = DECK_APPEAR_DURATION;
  const pauseDuration = DECK_PAUSE;
  const totalDuration =
    appearDuration + pauseDuration + cardDelay + ANIMATION_DURATION;

  const t1 = appearDuration / totalDuration;
  const t2 = (appearDuration + pauseDuration + cardDelay) / totalDuration;

  const deckPositionY = 83;

  return {
    initial: {
      x: 0,
      y: "110vh",
      opacity: 1,
      rotate: 0,
    },
    animate: {
      x: [0, 0, 0, `${targetX}vw`, `${targetX}vw`],
      y: [
        "110vh",
        `${deckPositionY}vh`,
        `${deckPositionY}vh`,
        `${targetY}vh`,
        `${targetY}vh`,
      ],
      rotate: [0, 0, 0, rotation, rotation],
      opacity: [1, 1, 1, 1, 0],
    },
    transition: {
      duration: totalDuration,
      times: [0, t1, t2, 0.95, 1],
      ease: "easeOut",
    },
  };
};
