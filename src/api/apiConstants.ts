import { projectEnv } from '../config/projectEnv';
import axios from 'axios';

export const SERVER = projectEnv.apiUrl;
export const PEER_SERVER = projectEnv.peerUrl;
export const PEER_PORT = projectEnv.peerPort;
export const IS_PROD = projectEnv.isProd;

axios.defaults.baseURL = SERVER;

export const queryKeys = {
  users: 'users',
  user: 'user',
};

export const FIVE_MINUTES = 1000 * 60 * 5;
