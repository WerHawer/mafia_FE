export enum wsEvents {
  connection = "connection",
  connectionError = "connect_error",
  peerConnection = "peerConnection",
  peerDisconnect = "peerDisconnect",
  roomConnection = "roomConnection",
  roomLeave = "roomLeave",
  userConnectedCount = "userConnectedCount",
  messageSend = "messageSend",
  disconnect = "disconnect",
  stream = "stream",
  call = "call",
  updateGame = "updateGame",
}
