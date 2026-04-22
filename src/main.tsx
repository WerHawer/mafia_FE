import "./i18n";
import "./styles/index.scss";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { RouterProvider } from "react-router-dom";


import { SocketProvider } from "./context/SocketProvider.tsx";
import { setupAxiosInterceptors } from "./helpers/setupAxiosInterceptors.ts";
import { router } from "./router/router.tsx";

const queryClient = new QueryClient();

setupAxiosInterceptors();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    {/*<ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />*/}

    <SocketProvider>
      <RouterProvider router={router} />
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: 'rgba(28, 28, 30, 0.95)',
            color: '#fff',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            fontSize: '1.4rem',
          },
        }} 
      />
    </SocketProvider>
  </QueryClientProvider>
);
