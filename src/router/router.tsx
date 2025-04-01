import { Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { AuthLayout } from "@/layouts/AuthLayout.tsx";

import { AuthGate } from "../components/AuthGate.tsx";
import { RootLayout } from "../layouts/RootLayout.tsx";
import { LazyNotFoundPage } from "./lazyComponents";
import {
  LazyGamePage,
  LazyHomePage,
  LazyLoginPage,
  LazySettingsPage,
  LazySingUpPage,
} from "./lazyComponents.ts";
import { routes } from "./routs.ts";

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

      {
        path: routes.settings,
        element: (
          <Suspense>
            <LazySettingsPage />
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
