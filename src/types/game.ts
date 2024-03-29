import { UserId } from "./user.ts";

export interface IGameFlow {
  id: string;
  speaker: UserId;
  speakTimer: number;
  isStarted: boolean;
  isFinished: boolean;
  isNight: boolean;
}

export enum GameType {
  Standard = "standard",
  Expand = "expand",
}

export interface IGame {
  id: string;
  owner: UserId;
  players: UserId[];
  password?: string;
  isPrivate: boolean;
  isActive: boolean;
  day: number;
  gm: UserId;
  mafia: UserId[];
  citizens: UserId[];
  cherif: UserId | null;
  doctor: UserId | null;
  maniac?: UserId | null;
  slut?: UserId | null;
  killed: UserId[];
  startTime: number | null;
  finishTime: number | null;
  creatingTime: number;
  gameType: GameType;
}

export interface IGameDTO extends Omit<IGame, "id"> {}
