import { projectEnv } from '../config/projectEnv';

export const LOCAL_SERVER = projectEnv.localAPIURL;
export const PRODUCTION_SERVER = projectEnv.productionAPIURL;

export const queryKeys = {
  users: 'users',
  user: 'user',
};

export const FIVE_MINUTES = 1000 * 60 * 5;
