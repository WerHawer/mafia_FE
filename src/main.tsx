import "./i18n";
import "./styles/index.scss";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";


import { SocketProvider } from "./context/SocketProvider.tsx";
import { router } from "./router/router.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    {/*<ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />*/}

    <SocketProvider>

      <RouterProvider router={router} />
    </SocketProvider>
  </QueryClientProvider>
);
