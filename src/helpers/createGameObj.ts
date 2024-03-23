import { GameType, IGameDTO } from "../types/game.ts";
import { UserId } from "../types/user.ts";

type CreateGameProps = {
  owner: UserId;
  password?: string;
  gameType?: GameType;
};

export const createGameObj = ({
  owner,
  password,
  gameType = GameType.Standard,
}: CreateGameProps): IGameDTO => {
  const expandedRoles =
    gameType === GameType.Expand ? { maniac: null, prostitute: null } : {};

  return {
    owner,
    players: [owner],
    password,
    isPrivate: !!password,
    isActive: true,
    day: 0,
    gm: owner,
    mafia: [],
    citizens: [],
    cherif: null,
    doctor: null,
    killed: [],
    startTime: null,
    finishTime: null,
    creatingTime: Date.now(),
    gameType,
    ...expandedRoles,
  };
};
