import { Roles } from "@/types/game.types.ts";

type Position = {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
};

export type BubbleConfig = {
  // bubble wrap position — raw css values, set whichever sides you need
  wrap: Position;
  // tail position relative to the bubble + which side it protrudes from
  tail: Position & { side: "left" | "right" };
};

// Layout-only config. Slide texts live in i18n under game.roleTutorial.slides.<role>.
export const ROLE_TUTORIAL_BUBBLES: Partial<Record<Roles, BubbleConfig>> = {
  // image is mirrored → character on RIGHT → bubble sits LEFT, tail points right toward character
  [Roles.Don]: {
    wrap: { bottom: "21rem", right: "21rem" },
    tail: { side: "right", top: "65%" },
  },
  // character on LEFT → bubble sits RIGHT, tail from LEFT
  [Roles.Mafia]: {
    wrap: { bottom: "23rem", left: "23rem" },
    tail: { side: "left", top: "70%" },
  },
  // character left-center at desk → bubble sits RIGHT, tail from LEFT
  [Roles.Sheriff]: {
    wrap: { top: "3rem", left: "32rem" },
    tail: { side: "left", top: "50%" },
  },
  // character center-right in ambulance → bubble sits LEFT, tail from RIGHT
  [Roles.Doctor]: {
    wrap: { top: "8rem", right: "32rem" },
    tail: { side: "right", top: "50%" },
  },
  // character left-center on throne → bubble sits RIGHT, tail from LEFT
  [Roles.Prostitute]: {
    wrap: { top: "3rem", left: "34rem" },
    tail: { side: "left", top: "50%" },
  },
};
