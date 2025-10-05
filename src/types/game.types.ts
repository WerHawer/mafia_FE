import { UserId } from "./user.types.ts";

export enum Roles {
  Mafia = "mafia",
  Don = "don",
  Citizen = "citizens",
  Sheriff = "sheriff",
  Doctor = "doctor",
  Maniac = "maniac",
  Prostitute = "prostitute",
  GM = "gm",
  Unknown = "unknown",
}

export const rolesWhoCanCheck = [Roles.Don, Roles.Sheriff];

export type GameId = string;

export enum GameType {
  Standard = "standard",
  Expand = "expand",
}

export interface IGameFlow {
  speaker: UserId;
  speakTime: number;
  votesTime: number;
  isStarted: boolean;
  isFinished: boolean;
  isNight: boolean;
  isVote: boolean;
  isReVote: boolean;
  isExtraSpeech: boolean;
  day: number;
  proposed: UserId[];
  voted: { [key: UserId]: UserId[] };
  wakeUp: UserId[] | UserId;
  shoot: [UserId, UserId][];
  killed: UserId[];
  sheriffCheck?: UserId;
  doctorSave?: UserId;
  donCheck?: UserId;
}

export interface IGameRoles {
  [Roles.Mafia]?: UserId[];
  [Roles.Citizen]?: UserId[];
  [Roles.Sheriff]?: UserId;
  [Roles.Doctor]?: UserId;
  [Roles.Maniac]?: UserId;
  [Roles.Prostitute]?: UserId;
}

export interface IGame extends IGameRoles {
  id: GameId;
  owner: UserId;
  players: UserId[];
  password?: string;
  isPrivate: boolean;
  isActive: boolean;
  startTime: number | null;
  finishTime: number | null;
  creatingTime: number;
  gameType: GameType;
  gameFlow: IGameFlow;
  [Roles.GM]: UserId;
}

export interface IGameShort {
  id: GameId;
  owner: UserId;
  playersCount: number;
  isPrivate: boolean;
  isActive: boolean;
  gm: UserId;
  gameType: GameType;
  creatingTime: number;
}

export interface IRoomConnectInfo {
  gameId: GameId;
  userId: UserId;
  game: IGameShort;
}

export interface IGameDTO extends Omit<IGame, "id"> {}
