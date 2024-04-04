import { lazy } from "react";

export const LazyApp = lazy(() => import("../pages/App"));
export const LazyGamePage = lazy(() => import("../pages/Game"));
export const LazyLobbyPage = lazy(() => import("../pages/Lobby"));
export const LazyLoginPage = lazy(() => import("../pages/Login"));
