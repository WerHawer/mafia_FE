import { createBrowserRouter } from 'react-router-dom'
import App from '../App.tsx'
import { VideoPage, VideoRoom } from '../pages/Video'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },

  {
    path: '/video/*',
    element: <VideoPage />,
  },

  {
    path: 'video/:id',
    element: <VideoRoom />,
  },

  {
    path: '/contact',
    element: <h1>Contact</h1>,
  },
  {
    path: '/:catchAll(.*)',
    element: <h1>Not Found</h1>,
  },
])
