import axios from "axios";
import { IUser } from "../../types/user.types.ts";

export const userLogin = async (loginData: {
  email: string;
  password: string;
}) => axios.post(`/login`, loginData);

export const auth = async (token?: string) => {
  return axios.get<{ message: string; user: IUser }>(`/auth`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};
