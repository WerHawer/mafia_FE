import { UserId } from "./user.types.ts";

export type GameId = string;

export enum GameType {
  Standard = "standard",
  Expand = "expand",
}

export interface IGameFlow {
  speaker: UserId;
  speakTime: number;
  isStarted: boolean;
  isFinished: boolean;
  isNight: boolean;
  day: number;
  proposed: UserId[];
  killed: UserId[];
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
