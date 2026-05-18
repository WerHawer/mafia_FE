import { useCallback, useEffect, useState } from "react";

/**
 * Enumerates available media devices of the given kind.
 * Automatically refreshes when devices are plugged/unplugged.
 * NOTE: Full device labels are only available after permissions are granted
 * (camera/mic access is already obtained in our game flow, so this is fine).
 */
export const useDeviceList = (kind: MediaDeviceKind) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  const refresh = useCallback(async () => {
    if (!navigator.mediaDevices) return;

    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices(all.filter((d) => d.kind === kind));
    } catch {
      setDevices([]);
    }
  }, [kind]);

  useEffect(() => {
    // navigator.mediaDevices is only available in secure contexts (HTTPS / localhost).
    // When accessed over plain HTTP from another device on the LAN it will be undefined.
    if (!navigator.mediaDevices) return;

    void refresh();
    navigator.mediaDevices.addEventListener("devicechange", refresh);

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", refresh);
    };
  }, [refresh]);

  return { devices, refresh };
};
