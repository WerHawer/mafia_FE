import { shuffle } from "lodash/fp";
import { IGameRoles } from "../types/game.types.ts";
import { UserId } from "../types/user.types.ts";

type AllRoles = keyof IGameRoles;

type Options = {
  isStandard?: boolean;
  mafiaCount?: number;
  sheriffCount?: number;
};

// TODO: think about how to make it more flexible
export const rolesCreator = (playersWithoutGM: UserId[], options?: Options) => {
  const { isStandard = true, mafiaCount = 3, sheriffCount = 1 } = options || {};

  const shuffledPlayersWithoutGM = shuffle(playersWithoutGM);

  const standardRoles = {
    mafia: mafiaCount,
    sheriff: sheriffCount,
  };

  const customRoles = {
    doctor: 1,
    prostitute: 1,
  };

  const allActiveRoles = isStandard
    ? standardRoles
    : { ...standardRoles, ...customRoles };

  const roles = Object.entries(allActiveRoles) as Array<[AllRoles, number]>;

  const userRoles = roles.reduce(
    (acc, [role, count]) => {
      const spliced = shuffledPlayersWithoutGM.splice(0, count);

      // @ts-ignore
      acc[role] = spliced.length === 1 ? spliced[0] : spliced;

      return acc;
    },
    {} as { [Key in AllRoles]?: IGameRoles[Key] }
  );

  return { ...userRoles, citizens: shuffledPlayersWithoutGM };
};
