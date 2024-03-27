import { projectEnv } from "../config/projectEnv";
import axios from "axios";

export const SERVER = projectEnv.apiUrl;
export const PEER_SERVER = projectEnv.peerUrl;
export const PEER_PORT = projectEnv.peerPort;
export const IS_PROD = projectEnv.isProd;

export const TOKEN_KEY = "token";

axios.defaults.baseURL = SERVER;

export const queryKeys = {
  users: "users",
  user: "user",
  games: "games",
  game: "game",
  auth: "auth",
};

export const ONE_MINUTE = 1000 * 60;
export const FIVE_MINUTES = ONE_MINUTE * 5;
export const ONE_HOUR = ONE_MINUTE * 60;
export const ONE_DAY = ONE_HOUR * 24;
