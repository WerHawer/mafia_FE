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

export type NightRoles = Exclude<
  Roles,
  Roles.Unknown | Roles.GM | Roles.Citizen
>;

export const rolesWhoCanCheck = [Roles.Don, Roles.Sheriff];

export type GameId = string;

export enum GameType {
  Standard = "standard",
  Expand = "expand",
}

export interface IGameFlow {
  speaker: UserId;
  speakTime: number;
  candidateSpeakTime: number;
  votesTime: number;
  isStarted: boolean;
  isFinished: boolean;
  isPostGame?: boolean;
  isNight: boolean;
  isVote: boolean;
  isReVote: boolean;
  isExtraSpeech: boolean;
  day: number;
  proposed: UserId[];
  proposedBy: Record<UserId, UserId>;
  voted: { [key: UserId]: UserId[] };
  wakeUp: UserId[] | UserId;
  shoot: { [key: UserId]: { shooters: UserId[]; shots: { x: number; y: number }[] } };
  killed: UserId[];
  sheriffCheck?: UserId;
  doctorSave?: UserId;
  donCheck?: UserId;
  prostituteBlock?: UserId;
  prostituteBlockPos?: { x: number; y: number };
  sleeping: UserId[];
}

export interface IGameRoles {
  [Roles.Mafia]?: UserId[];
  [Roles.Citizen]?: UserId[];
  [Roles.Sheriff]?: UserId;
  [Roles.Doctor]?: UserId;
  [Roles.Maniac]?: UserId;
  [Roles.Prostitute]?: UserId;
  [Roles.Don]?: UserId;
}

export interface IGame extends IGameRoles {
  id: GameId;
  owner: UserId;
  players: UserId[];
  maxPlayers: number;
  password?: string;
  isPrivate: boolean;
  isActive: boolean;
  mafiaCount: number;
  additionalRoles: Roles[];
  startTime: number | null;
  finishTime: number | null;
  creatingTime: number;
  gameType: GameType;
  gameFlow: IGameFlow;
  skipFirstNightIfOneMafia?: boolean;
  observers: UserId[];
  [Roles.GM]: UserId;
}

export interface IGameShort {
  id: GameId;
  owner: UserId;
  playersCount: number;
  maxPlayers?: number;
  isPrivate: boolean;
  isActive: boolean;
  isStarted: boolean;
  gm: UserId;
  gameType: GameType;
  creatingTime: number;
  mafiaCount?: number;
  additionalRoles?: Roles[];
  observers?: UserId[];
}

export interface IRoomConnectInfo {
  gameId: GameId;
  userId: UserId;
  game: IGameShort;
}

export interface IGameDTO extends Omit<IGame, "id"> {}
