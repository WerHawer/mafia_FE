import { UserId } from "../types/user.types.ts";
import { GameType, IGameDTO, IGameFlow } from "../types/game.types.ts";

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
  shoot: [],
  wakeUp: [],
};

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
  return {
    owner,
    players: [owner],
    password,
    isPrivate: !!password,
    isActive: true,
    gm: owner,
    mafia: [],
    citizens: [],
    startTime: null,
    finishTime: null,
    creatingTime: Date.now(),
    gameType,
    gameFlow: initialGameFlow,
  };
};
