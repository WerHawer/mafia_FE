import axios from "axios";
import { IMessage } from "../../types/message.ts";

const MESSAGES_URL = "/messages";

export const getAllPublicMessages = async () => {
  return await axios.get<IMessage[]>(`${MESSAGES_URL}/`);
};
