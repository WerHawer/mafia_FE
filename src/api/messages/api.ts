import axios from "axios";

import { IMessage } from "../../types/message.types.ts";

const MESSAGES_URL = "/messages";

export const getAllPublicMessages = async () => {
  return await axios.get<IMessage[]>(`${MESSAGES_URL}/`);
};

export const getRoomMessages = async (id: string) => {
  return await axios.get<IMessage[]>(`${MESSAGES_URL}/room/${id}`);
};
