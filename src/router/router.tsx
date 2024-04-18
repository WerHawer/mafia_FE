import { Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { RootLayout } from "../layouts/RootLayout.tsx";
import { routes } from "./routs.ts";
import { AuthGate } from "../components/AuthGate.tsx";
import { LazyApp, LazyLobbyPage, LazyLoginPage } from "./lazyComponents.ts";
import GamePage from "@/pages/Game";

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
            <LazyApp />
          </Suspense>
        ),
      },

      {
        path: routes.lobby,
        element: (
          <Suspense>
            <LazyLobbyPage />
          </Suspense>
        ),
      },

      {
        path: routes.game,
        element: <Navigate to={routes.lobby} />,
      },

      {
        path: `${routes.game}/:id`,
        element: <GamePage />,
      },

      {
        path: routes.login,
        element: (
          <Suspense>
            <LazyLoginPage />
          </Suspense>
        ),
      },

      {
        path: "/:catchAll(.*)",
        element: <h1>Not Found</h1>,
      },
    ],
  },
]);
