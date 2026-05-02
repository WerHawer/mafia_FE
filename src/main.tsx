import "./i18n";
import "./styles/index.scss";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { RouterProvider } from "react-router-dom";

import faviconHref from "@/assets/icons/favicon.webp";
import { projectEnv } from "./config/projectEnv.ts";
import { SocketProvider } from "./context/SocketProvider.tsx";
import { setupAxiosInterceptors } from "./helpers/setupAxiosInterceptors.ts";
import { router } from "./router/router.tsx";

// Control PostHog initialization with env var VITE_ENABLE_ANALYTICS and hostname
// eslint-disable-next-line @typescript-eslint/no-explicit-any

const faviconLink =
  document.querySelector<HTMLLinkElement>("link[rel~='icon']") ??
  (() => {
    const link = document.createElement("link");

    link.rel = "icon";
    document.head.appendChild(link);

    return link;
  })();

faviconLink.type = "image/webp";
faviconLink.href = faviconHref;

const rawEnable = projectEnv.isTrackingEnabled;
const analyticsEnabled =
  rawEnable === true || rawEnable === "true" || rawEnable === "1";
const hostname = typeof window !== "undefined" ? window.location.hostname : "";
const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(hostname);

const enablePostHog = analyticsEnabled && !isLocalhost;

if (enablePostHog) {
  posthog.init(projectEnv.postHogKey, {
    api_host: projectEnv.postHogHost,
    capture_pageview: false,
  });
} else {
  // eslint-disable-next-line no-console
  console.debug("PostHog not initialized", { rawEnable, hostname });
}

const queryClient = new QueryClient();

setupAxiosInterceptors();

const app = (
  <QueryClientProvider client={queryClient}>
    {/*<ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />*/}

    <SocketProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "rgba(28, 28, 30, 0.95)",
            color: "#fff",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            fontSize: "1.4rem",
          },
        }}
      />
    </SocketProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(
  enablePostHog ? (
    <PostHogProvider client={posthog}>{app}</PostHogProvider>
  ) : (
    app
  )
);
