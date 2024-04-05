import axios from "axios";
import { IUser } from "../../types/user.types.ts";

const USER_URL = "/users";

export const getUsers = async () => axios.get<IUser[]>(USER_URL);

export const getUserById = async (id: string) =>
  axios.get<IUser>(`${USER_URL}/${id}`);
