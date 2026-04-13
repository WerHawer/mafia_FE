import axios from "axios";

import { IMessage } from "../../types/message.types.ts";
import { IUser } from "../../types/user.types.ts";

const USER_URL = "/users";

export const getUsers = async () => axios.get<IUser[]>(USER_URL);

export const getUserById = async (id: string) =>
  axios.get<IUser>(`${USER_URL}/${id}`);

export const getUsersByIds = async (ids: string[]) =>
  axios.get<IUser[]>(`${USER_URL}/ids`, { params: { ids: ids.join(",") } });

export type UpdateAvatarResponse = {
  user: IUser;
  message: string;
  messages?: IMessage[];
};

export const updateAvatar = async (
  userId: string,
  file: File
): Promise<UpdateAvatarResponse> => {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await axios.patch<UpdateAvatarResponse>(
    `${USER_URL}/${userId}/avatar`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return response.data;
};

export const deleteAvatar = async (
  avatarId: string
): Promise<UpdateAvatarResponse> => {
  const response = await axios.delete<UpdateAvatarResponse>(
    `${USER_URL}/${avatarId}`
  );

  return response.data;
};
