import axios from "axios";

export const addTokenToAxios = (token: string) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};
