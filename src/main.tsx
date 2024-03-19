import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "./styles/index.scss";
import "./i18n";
import { RouterProvider } from "react-router-dom";
import { router } from "./router/router.tsx";
import { SocketProvider } from "./context/SocketProvider.tsx";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
        <RouterProvider router={router} />
      </SocketProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
