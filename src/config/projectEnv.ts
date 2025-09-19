export const projectEnv = {
  localAPIURL: import.meta.env.VITE_LOCAL_API_URL,
  productionAPIURL: import.meta.env.VITE_PROD_API_URL,
  peerUrl: import.meta.env.VITE_PEER_URL,
  apiUrl: import.meta.env.VITE_API_URL,
  wsUrl: import.meta.env.VITE_WS_URL,
  peerPort: import.meta.env.VITE_PEER_PORT,
  isProd: import.meta.env.PROD,
  isDev: import.meta.env.DEV,
  liveKitUrl: import.meta.env.VITE_LIVEKIT_URL,
  liveKitKey: import.meta.env.VITE_LIVEKIT_KEY,
  liveKitSecret: import.meta.env.VITE_LIVEKIT_SECRET,
};
