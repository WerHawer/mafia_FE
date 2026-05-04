import { IGameFlow, Roles } from "@/types/game.types.ts";

export const isMafiaRole = (role?: Roles): boolean => {
  return role === Roles.Mafia || role === Roles.Don;
};

export const canSeeMafiaShot = ({
  role,
  gameFlow,
}: {
  role?: Roles;
  gameFlow: IGameFlow;
}): boolean => {
  return isMafiaRole(role) && gameFlow.isNight;
};
