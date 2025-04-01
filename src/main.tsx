import "./styles/index.scss";
import "./i18n";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { ModalFabric } from "@/components/Modals";

import { SocketProvider } from "./context/SocketProvider.tsx";
import { router } from "./router/router.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/*<ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />*/}

      <SocketProvider>
        <ModalFabric />
        <RouterProvider router={router} />
      </SocketProvider>
    </QueryClientProvider>
  </StrictMode>
);
