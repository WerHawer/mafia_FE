export const projectEnv = {
  localAPIURL: import.meta.env.VITE_LOCAL_API_URL,
  productionAPIURL: import.meta.env.VITE_PROD_API_URL,
  peerUrl: import.meta.env.VITE_PEER_URL,
  apiUrl: import.meta.env.VITE_API_URL,
  peerPort: import.meta.env.VITE_PEER_PORT,
  isProd: import.meta.env.PROD,
  isDev: import.meta.env.DEV,
};
