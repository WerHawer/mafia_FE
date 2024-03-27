import axios from "axios";

export const removeTokenFromAxios = () => {
  delete axios.defaults.headers.common["Authorization"];
};
