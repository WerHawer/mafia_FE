import { observer } from "mobx-react-lite";
import { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuthQuery } from "../api/auth/queries.ts";
import { addTokenToAxios } from "../helpers/addTokenToAxios.ts";
import { removeTokenFromAxios } from "../helpers/removeTokenFromAxios.ts";
import { useSocket } from "../hooks/useSocket.ts";
import { routes } from "../router/routs.ts";
import { usersStore } from "../store/usersStore.ts";

const authFreeRoutes = [routes.login, routes.singUp];

// TODO: remember initial path and fo to this path after login

export const AuthGate = observer(({ children }: PropsWithChildren) => {
  const { pathname } = useLocation();
  const { token, me, setMyUser, logout } = usersStore;
  const { disconnect } = useSocket();

  const { error, data } = useAuthQuery(token);

  const corePath = pathname.split("/")[1];
  const isKnownRoute = Object.values(routes).includes(`/${corePath}`);

  if (!isKnownRoute) {
    return <Navigate to={token ? routes.home : routes.login} />;
  }

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
