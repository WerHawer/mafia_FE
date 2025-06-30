import axios from "axios";

import { LoginFormInputs } from "@/components/LoginForm/config.ts";
import { SingUpFormInputs } from "@/components/SingUpForm/config.ts";
import { IUser } from "@/types/user.types.ts";

export const userLogin = async (loginData: LoginFormInputs) =>
  axios.post(`/login`, loginData);

export const userSignUp = async (
  signUpData: Omit<SingUpFormInputs, "passwordRepeat">
) => {
  return axios.post(`/signUp`, signUpData);
};

export const auth = async (token?: string) => {
  return axios.get<{ message: string; user: IUser }>(`/auth`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};
