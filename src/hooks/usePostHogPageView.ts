import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { usersStore } from "../store/usersStore.ts";

// This hook captures pageviews to PostHog and includes current user's id and name
// so analytics show readable user names instead of only ids.
export const usePostHogPageView = () => {
  const location = useLocation();
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthog) return;

    // Analytics enabled flag is controlled via Vite env var VITE_ENABLE_ANALYTICS
    // Accepts string 'true' or '1' (case-sensitive) or boolean true.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getEnv = (name: string) =>
      typeof import.meta !== "undefined" ? (import.meta as any).env?.[name] : undefined;

    const rawEnable = getEnv("VITE_ENABLE_ANALYTICS");
    const analyticsEnabled =
      rawEnable === true || rawEnable === "true" || rawEnable === "1";

    const hostname = typeof window !== "undefined" ? window.location.hostname : "";
    const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(hostname);

    if (!analyticsEnabled || isLocalhost) {
      // eslint-disable-next-line no-console
      console.debug("PostHog disabled by VITE_ENABLE_ANALYTICS or running on localhost", { rawEnable, hostname });

      return;
    }

    const userId = usersStore.myId;
    const userName = usersStore.me?.nikName ?? usersStore.getUserName(userId);

    // Identify the user in PostHog (so future events are linked)
    if (userId) {
      try {
        posthog.identify(userId);
      } catch (e) {
        // ignore identify errors
        // eslint-disable-next-line no-console
        console.warn("posthog.identify failed", e);
      }
    }

    // Also set user properties on the identified person so UI shows readable names
    if (userId || userName) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const people = (posthog as any).people;

        if (people && typeof people.set === "function") {
          const personProps: Record<string, unknown> = {};

          if (userName) {
            // common property names used in PostHog UI
            personProps.person_display_name = userName;
            personProps.name = userName;
          }

          if (usersStore.me?.email) {
            personProps.email = usersStore.me.email;
          }

          if (Object.keys(personProps).length > 0) {
            people.set(personProps);
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("posthog.people.set failed", e);
      }
    }

    const props: Record<string, unknown> = { $current_url: window.location.href };

    if (userId) props.user_id = userId;
    if (userName) props.user_name = userName;

    try {
      posthog.capture("$pageview", props);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("posthog.capture failed", e);
    }
  }, [location, posthog]);
};
