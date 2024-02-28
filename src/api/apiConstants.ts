import { projectEnv } from '../config/projectEnv';

const LOCAL_SERVER = projectEnv.localAPIURL;
const PRODUCTION_SERVER = projectEnv.productionAPIURL;

export const SERVER = LOCAL_SERVER || PRODUCTION_SERVER;

export const queryKeys = {
  users: 'users',
  user: 'user',
};

export const FIVE_MINUTES = 1000 * 60 * 5;
