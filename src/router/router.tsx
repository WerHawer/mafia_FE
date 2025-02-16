import { Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { RootLayout } from "../layouts/RootLayout.tsx";
import { routes } from "./routs.ts";
import { AuthGate } from "../components/AuthGate.tsx";
import {
  LazyGamePage,
  LazyHomePage,
  LazyLoginPage,
  LazySingUpPage,
} from "./lazyComponents.ts";
import { AuthLayout } from "@/layouts/AuthLayout.tsx";
import { LazyNotFoundPage } from "./lazyComponents";

export const router = createBrowserRouter([
  {
    element: (
      <AuthGate>
        <RootLayout />
      </AuthGate>
    ),
    children: [
      {
        path: routes.home,
        element: (
          <Suspense>
            <LazyHomePage />
          </Suspense>
        ),
      },

      {
        path: routes.game,
        element: <Navigate to={routes.home} />,
      },

      {
        path: `${routes.game}/:id`,
        element: (
          <Suspense>
            <LazyGamePage />
          </Suspense>
        ),
      },
    ],
  },
  {
    element: (
      <AuthGate>
        <AuthLayout />
      </AuthGate>
    ),
    children: [
      {
        path: routes.singUp,
        element: (
          <Suspense>
            <LazySingUpPage />
          </Suspense>
        ),
      },
      {
        path: routes.login,
        element: (
          <Suspense>
            <LazyLoginPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "*",
    element: (
      <Suspense>
        <LazyNotFoundPage />
      </Suspense>
    ),
  },
]);
