import { UserId } from "./user.types.ts";

export enum Roles {
  Mafia = "mafia",
  Don = "don",
  Citizens = "citizens",
  Sheriff = "sheriff",
  Doctor = "doctor",
  Maniac = "maniac",
  Prostitute = "prostitute",
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
  shoot: UserId[];
  killed: UserId[];
  sheriffCheck?: UserId;
  doctorSave?: UserId;
  donCheck?: UserId;
}

export interface IGame {
  id: GameId;
  owner: UserId;
  players: UserId[];
  password?: string;
  isPrivate: boolean;
  isActive: boolean;
  gm: UserId;
  mafia?: UserId[];
  citizens?: UserId[];
  sheriff?: UserId;
  doctor?: UserId;
  maniac?: UserId;
  prostitute?: UserId;
  startTime: number | null;
  finishTime: number | null;
  creatingTime: number;
  gameType: GameType;
  gameFlow: IGameFlow;
}

export interface IGameRoles {
  mafia: IGame["mafia"];
  citizens: IGame["citizens"];
  sheriff: IGame["sheriff"];
  doctor: IGame["doctor"];
  maniac: IGame["maniac"];
  prostitute: IGame["prostitute"];
}

export interface IGameDTO extends Omit<IGame, "id"> {}
