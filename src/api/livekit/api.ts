import axios from "axios";

import { queryKeys } from "@/api/apiConstants.ts";

export interface ILiveKitTokenRequest {
  roomName: string;
  participantName: string;
  metadata?: any;
}

export interface ILiveKitTokenResponse {
  token: string;
  wsUrl: string;
}

export const getLiveKitToken = async ({
  roomName,
  participantName,
  metadata,
}: ILiveKitTokenRequest) => {
  return axios.post<ILiveKitTokenResponse>(`${queryKeys.liveKit}/token`, {
    roomName,
    participantName,
    metadata,
  });
};
