import { lazy } from "react";

export const LazyGamePage = lazy(() => import("../pages/Game"));
export const LazyHomePage = lazy(() => import("../pages/Home"));
export const LazyLoginPage = lazy(() => import("../pages/Login"));
export const LazySingUpPage = lazy(() => import("../pages/SingUp"));
