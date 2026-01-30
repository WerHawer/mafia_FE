import axios from "axios";

import {
  GameId,
  IGame,
  IGameDTO,
  IGameFlow,
  IGameRoles,
  IGameShort,
} from "@/types/game.types.ts";
import { UserId } from "@/types/user.types.ts";

const GAMES_URL = "/games";

// TODO: return ?active=true after testing
export const fetchActiveGames = async () => {
  return axios.get<IGameShort[]>(`${GAMES_URL}`);
};

export const fetchGames = async () => {
  return axios.get<IGameShort[]>(GAMES_URL);
};

export const createGame = async (game: IGameDTO) => {
  return axios.post<IGame>(GAMES_URL, game);
};

export const fetchGame = async (id: GameId) => {
  return axios.get<IGame>(`${GAMES_URL}/${id}`);
};

export const addUserToGame = async ({
  gameId,
  userId,
}: {
  gameId: GameId;
  userId: UserId;
}) => {
  return axios.patch<IGame>(`${GAMES_URL}/${gameId}/addUser/${userId}`);
};

export const removeUserFromGame = async ({
  gameId,
  userId,
}: {
  gameId: GameId;
  userId: UserId;
}) => {
  return axios.patch<IGame>(`${GAMES_URL}/${gameId}/removeUser/${userId}`);
};

export const verifyGamePassword = async ({
  gameId,
  password,
}: {
  gameId: GameId;
  password: string;
}) => {
  return axios.post<{ valid: boolean }>(
    `${GAMES_URL}/${gameId}/verify-password`,
    { password }
  );
};

export const addRolesToGame = async (
  gameId: GameId,
  roles: Partial<IGameRoles>
) => {
  return axios.patch<IGame>(`${GAMES_URL}/${gameId}/addRoles`, roles);
};

export const updateGameGM = async ({
  gameId,
  userId,
}: {
  gameId: GameId;
  userId: UserId;
}) => {
  return axios.patch<IGame>(`${GAMES_URL}/${gameId}/updateGM`, { gm: userId });
};

export const startGame = async (gameId: GameId) => {
  return axios.patch<IGame>(`${GAMES_URL}/${gameId}/start`);
};

export const updateGameFlow = async ({
  gameId,
  flow,
}: {
  gameId: GameId;
  flow: IGameFlow;
}) => {
  return axios.patch<IGame>(`${GAMES_URL}/${gameId}/updateFlow`, {
    gameFlow: flow,
  });
};

export const restartGame = async (gameId: GameId) => {
  return axios.patch<IGame>(`${GAMES_URL}/${gameId}/restart`);
};

export const startDay = async (gameId: GameId) => {
  return axios.patch<IGame>(`${GAMES_URL}/${gameId}/startDay`);
};

export const startNight = async (gameId: GameId) => {
  return axios.patch<IGame>(`${GAMES_URL}/${gameId}/startNight`);
};

export const addUserToProposed = async ({
  gameId,
  userId,
}: {
  gameId: GameId;
  userId: UserId;
}) => {
  return axios.patch<IGame>(`${GAMES_URL}/${gameId}/addToProposed`, {
    userId,
  });
};

export const voteForUser = async ({
  gameId,
  targetUserId,
  voterId,
}: {
  gameId: GameId;
  targetUserId: UserId;
  voterId: UserId;
}) => {
  return axios.patch<IGame>(`${GAMES_URL}/${gameId}/vote`, {
    targetUserId,
    voterId,
  });
};

export const shootUser = async ({
  gameId,
  targetUserId,
  shooterId,
}: {
  gameId: GameId;
  targetUserId: UserId;
  shooterId: UserId;
}) => {
  return axios.patch<IGame>(`${GAMES_URL}/${gameId}/shoot`, {
    targetUserId,
    shooterId,
  });
};
