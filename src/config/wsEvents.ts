export enum wsEvents {
  connection = 'connection',
  connectionError = 'connect_error',
  peerConnection = 'peerConnection',
  peerDisconnect = 'peerDisconnect',
  roomConnection = 'roomConnection',
  roomDisconnect = 'roomDisconnect',
  userConnectedCount = 'userConnectedCount',
  messagesGetAll = 'messagesGetAll',
  messagesGetRoom = 'messagesGetRoom',
  messageSend = 'messageSend',
  messageSendPrivate = 'messageSendPrivate',
  disconnect = 'disconnect',
}
