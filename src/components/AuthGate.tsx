import { PropsWithChildren } from "react";
import { useAuthQuery } from "../api/auth/queries.ts";
import { Navigate, useLocation } from "react-router-dom";
import { routes } from "../router/routs.ts";
import { addTokenToAxios } from "../helpers/addTokenToAxios.ts";
import { observer } from "mobx-react-lite";
import { usersStore } from "../store/usersStore.ts";
import { removeTokenFromAxios } from "../helpers/removeTokenFromAxios.ts";
import { useSocket } from "../hooks/useSocket.ts";

const authFreeRoutes = [routes.login, routes.singUp];

// TODO: remember initial path and fo to this path after login

export const AuthGate = observer(({ children }: PropsWithChildren) => {
  const { pathname } = useLocation();
  const { token, me, setMyUser, logout } = usersStore;
  console.log("token :", token);
  const { disconnect } = useSocket();

  const { error, data } = useAuthQuery(token);

  if (token && authFreeRoutes.includes(pathname)) {
    return <Navigate to={routes.home} />;
  }

  if (data && !me) {
    setMyUser(data.user);
  }

  if (error || !token) {
    logout();
    removeTokenFromAxios();
    disconnect();

    return !authFreeRoutes.includes(pathname) ? (
      <Navigate to={routes.login} />
    ) : (
      children
    );
  }

  addTokenToAxios(token);

  return children;
});
