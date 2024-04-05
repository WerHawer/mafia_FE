import axios from "axios";
import { GameId, IGame, IGameDTO } from "../../types/game.types.ts";
import { UserId } from "../../types/user.types.ts";

const GAMES_URL = "/games";

export const fetchActiveGames = async () => {
  return axios.get<IGame[]>(`${GAMES_URL}?active=true`);
};

export const fetchGames = async () => {
  return axios.get<IGame[]>(GAMES_URL);
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
