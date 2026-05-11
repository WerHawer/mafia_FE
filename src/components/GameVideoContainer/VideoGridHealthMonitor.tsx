import { observer } from "mobx-react-lite";

import { useNightMode } from "@/hooks/useNightMode.ts";
import { useVideoGridHealthRecovery } from "@/hooks/useVideoGridHealthRecovery.ts";

/**
 * Subscribes to LiveKit room state and triggers debounced recovery when expected
 * camera streams (per game + night rules) are missing or unhealthy. Renders nothing.
 * Must be mounted under `LiveKitRoom` so `useRoomContext()` is defined.
 */
export const VideoGridHealthMonitor = observer(() => {
  const { shouldShowMyVideo, shouldShowPlayerVideo } = useNightMode();

  useVideoGridHealthRecovery({
    shouldShowMyVideo,
    shouldShowPlayerVideo,
  });

  return null;
});

VideoGridHealthMonitor.displayName = "VideoGridHealthMonitor";
