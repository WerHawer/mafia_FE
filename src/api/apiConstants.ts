import axios from "axios";

import { projectEnv } from "../config/projectEnv";

export const SERVER = projectEnv.apiUrl;
export const LIVEKIT_SERVER =
  projectEnv.liveKitUrl ||
  (projectEnv.isProd ? "wss://your-livekit-server.com" : "ws://localhost:7880");
export const IS_PROD = projectEnv.isProd;
export const WS_SERVER = projectEnv.wsUrl;

axios.defaults.baseURL = SERVER;

export const queryKeys = {
  users: "users",
  user: "user",
  games: "games",
  game: "game",
  auth: "auth",
  messages: "messages",
  liveKit: "liveKit",
};

export const THIRTY_SECONDS = 1000 * 30;
export const ONE_MINUTE = 1000 * 60;
export const FIVE_MINUTES = ONE_MINUTE * 5;
export const ONE_HOUR = ONE_MINUTE * 60;
export const ONE_DAY = ONE_HOUR * 24;
