import { UserId } from "../types/user.types.ts";
import { shuffle } from "lodash/fp";
import { IGameRoles } from "../types/game.types.ts";

type Options = {
  isStandard?: boolean;
  mafiaCount?: number;
  sheriffCount?: number;
};

export const rolesCreator = (
  players: UserId[],
  gm: UserId | null,
  options?: Options,
) => {
  const { isStandard = true, mafiaCount = 3, sheriffCount = 1 } = options || {};

  const shuffledPlayersWithoutGM = shuffle(
    players.filter((player) => player !== gm),
  );

  const standardRoles = {
    mafia: mafiaCount,
    cherif: sheriffCount,
  };

  const customRoles = {
    doctor: 1,
    prostitute: 1,
  };

  const allActiveRoles = isStandard
    ? standardRoles
    : { ...standardRoles, ...customRoles };

  const allActiveRolesCount = Object.values(allActiveRoles).reduce(
    (a, b) => a + b,
  );

  const citizens = {
    citizens: shuffledPlayersWithoutGM.length - allActiveRolesCount,
  };

  type AllRoles = keyof IGameRoles;

  const roles = Object.entries({ ...allActiveRoles, ...citizens }) as Array<
    [AllRoles, number]
  >;

  return roles.reduce(
    (acc, [role, count]) => {
      const spliced = shuffledPlayersWithoutGM.splice(0, count);

      // @ts-ignore
      acc[role] = spliced.length === 1 ? spliced[0] : spliced;

      return acc;
    },
    {} as { [Key in AllRoles]?: IGameRoles[Key] },
  );
};
