import axios from "axios";
import { IGame, IGameDTO } from "../../types/game.ts";

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
