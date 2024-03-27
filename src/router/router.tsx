import { createBrowserRouter } from "react-router-dom";
import App from "../pages/App/App.tsx";
import { RootLayout } from "../layouts/RootLayout.tsx";
import { GamePage } from "../pages/Game/GamePage.tsx";
import { LobbyPage } from "../pages/Lobby/LobbyPage.tsx";
import { routes } from "./routs.ts";
import { LoginPage } from "../pages/Login";
import { AuthGate } from "../components/AuthGate.tsx";

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
        element: <App />,
      },

      {
        path: routes.lobby,
        element: <LobbyPage />,
      },

      {
        path: routes.game,
        element: <GamePage />,
      },

      {
        path: `${routes.game}/:id`,
        element: <GamePage />,
      },

      {
        path: routes.login,
        element: <LoginPage />,
      },

      {
        path: "/:catchAll(.*)",
        element: <h1>Not Found</h1>,
      },
    ],
  },
]);
