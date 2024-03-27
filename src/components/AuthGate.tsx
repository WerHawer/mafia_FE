import { PropsWithChildren } from "react";
import { useAuthQuery } from "../api/auth/queries.ts";
import { Navigate, useLocation } from "react-router-dom";
import { routes } from "../router/routs.ts";
import { addTokenToAxios } from "../helpers/addTokenToAxios.ts";
import { observer } from "mobx-react-lite";
import { userStore } from "../store/mobx/userStore.ts";

const authFreeRoutes = [routes.login];

export const AuthGate = observer(({ children }: PropsWithChildren) => {
  const { pathname } = useLocation();
  const { token } = userStore;

  const { error } = useAuthQuery(token);

  if ((error || !token) && !authFreeRoutes.includes(pathname)) {
    return <Navigate to={routes.login} />;
  }

  addTokenToAxios(token);

  return children;
});
