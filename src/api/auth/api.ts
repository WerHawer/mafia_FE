import axios from "axios";

export const userLogin = async (loginData: {
  email: string;
  password: string;
}) => axios.post(`/login`, loginData);

export const auth = async (token?: string) => {
  return axios.get(`/auth`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};
