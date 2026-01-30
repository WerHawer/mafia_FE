import { shuffle } from "lodash/fp";

import { IGameRoles, Roles } from "../types/game.types.ts";
import { UserId } from "../types/user.types.ts";

type Options = {
  mafiaCount: number;
  additionalRoles: Roles[];
};

export const rolesCreator = (
  playersWithoutGM: UserId[],
  options: Options
): IGameRoles => {
  const { mafiaCount, additionalRoles } = options;
  const roles: IGameRoles = {};
  const availablePlayers = shuffle(playersWithoutGM);

  /**
   * Helper to assign a single player to a specific role.
   * We cast to any for the singleton assignment as IGameRoles has a mix of shapes.
   */
  const assignSingleton = (role: Roles) => {
    const userId = availablePlayers.pop();
    if (userId) {
      (roles as any)[role] = userId;
    }
  };

  // 1. Assign Mafia
  const mafiaIds: UserId[] = [];
  const countToAssign = Math.min(mafiaCount, availablePlayers.length);

  for (let i = 0; i < countToAssign; i++) {
    const userId = availablePlayers.pop();
    if (userId) mafiaIds.push(userId);
  }
  roles[Roles.Mafia] = mafiaIds;

  // 2. Assign Mandatory Sheriff role
  assignSingleton(Roles.Sheriff);

  // 3. Assign Additional Roles (Doctor, Prostitute, etc.)
  // We filter out Sheriff just in case it was passed in the list to avoid double assignment attempts
  additionalRoles
    .filter((role) => role !== Roles.Sheriff)
    .forEach(assignSingleton);

  // 4. All remaining are Citizens
  roles[Roles.Citizen] = availablePlayers;

  return roles;
};
