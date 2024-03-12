import { createBrowserRouter } from 'react-router-dom';
import App from '../pages/App/App.tsx';
import { VideoPage, VideoRoom } from '../pages/Video';
import { RootLayout } from '../layouts/RootLayout.tsx';
import { GamePage } from '../pages/Game/GamePage.tsx';
import { LobbyPage } from '../pages/Lobby/LobbyPage.tsx';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <App />,
      },

      {
        path: '/lobby',
        element: <LobbyPage />,
      },

      {
        path: '/game',
        element: <GamePage />,
      },

      {
        path: 'game/:id',
        element: <GamePage />,
      },

      {
        path: '/contact',
        element: <h1>Contact</h1>,
      },

      {
        path: '/:catchAll(.*)',
        element: <h1>Not Found</h1>,
      },
    ],
  },
]);
