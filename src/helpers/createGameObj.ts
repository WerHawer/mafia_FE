import { GameType, IGameDTO, IGameFlow, Roles } from "../types/game.types.ts";
import { UserId } from "../types/user.types.ts";

export const initialGameFlow: IGameFlow = {
  speaker: "",
  speakTime: 60,
  votesTime: 15,
  isStarted: false,
  isFinished: false,
  isNight: false,
  isVote: false,
  isReVote: false,
  isExtraSpeech: false,
  day: 0,
  proposed: [],
  voted: {},
  killed: [],
  shoot: {},
  wakeUp: [],
};

type CreateGameProps = {
  owner: UserId;
  password?: string;
  gameType?: GameType;
  maxPlayers?: number;
  mafiaCount?: number;
  additionalRoles?: Roles[];
};

export const createGameObj = ({
  owner,
  password,
  gameType = GameType.Standard,
  maxPlayers = 10,
  mafiaCount = 3,
  additionalRoles = [],
}: CreateGameProps): IGameDTO => {
  return {
    owner,
    players: [owner],
    maxPlayers,
    password,
    isPrivate: !!password,
    isActive: true,
    mafiaCount,
    additionalRoles,
    [Roles.GM]: owner,
    [Roles.Mafia]: [],
    [Roles.Citizen]: [],
    startTime: null,
    finishTime: null,
    creatingTime: Date.now(),
    gameType,
    gameFlow: initialGameFlow,
  };
};
