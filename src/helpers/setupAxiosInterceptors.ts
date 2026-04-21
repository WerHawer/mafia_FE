import axios from "axios";
import { usersStore } from "../store/usersStore";
import { refreshTokenRequest } from "../api/auth/api";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

export const setupAxiosInterceptors = () => {
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        originalRequest.url !== "/refresh" &&
        originalRequest.url !== "/login" &&
        originalRequest.url !== "/signUp"
      ) {
        if (isRefreshing) {
          return new Promise(function (resolve, reject) {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers["Authorization"] = "Bearer " + token;
              return axios(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const rfToken = usersStore.refreshToken;
        if (!rfToken) {
          usersStore.logout();
          window.location.href = "/login";
          return Promise.reject(error);
        }

        return new Promise(function (resolve, reject) {
          refreshTokenRequest(rfToken)
            .then(({ data }) => {
              usersStore.setToken(data.token);
              if (data.refreshToken) {
                usersStore.setRefreshToken(data.refreshToken);
              }
              axios.defaults.headers.common["Authorization"] =
                "Bearer " + data.token;
              originalRequest.headers["Authorization"] = "Bearer " + data.token;
              processQueue(null, data.token);
              resolve(axios(originalRequest));
            })
            .catch((err) => {
              processQueue(err, null);
              usersStore.logout();
              window.location.href = "/login";
              reject(err);
            })
            .finally(() => {
              isRefreshing = false;
            });
        });
      }

      return Promise.reject(error);
    }
  );
};
