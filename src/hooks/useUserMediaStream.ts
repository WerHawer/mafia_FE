import { useEffect, useRef, useState } from "react";

/**
 * Reactive camera stream hook.
 * Re-requests getUserMedia whenever the constraint dimensions change
 * (e.g. when the user switches quality tier).
 * Previous tracks are stopped before the new request is made.
 */
export const useUserMediaStream = (options: MediaStreamConstraints) => {
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Use width/height/fps/deviceId as the restart key
  const video = options.video as MediaTrackConstraints | undefined;
  const width    = (video?.width     as ConstrainULongRange   | undefined)?.ideal ?? 0;
  const height   = (video?.height    as ConstrainULongRange   | undefined)?.ideal ?? 0;
  const fps      = (video?.frameRate as ConstrainDoubleRange  | undefined)?.ideal ?? 0;
  const deviceId = (video?.deviceId  as ConstrainDOMStringParameters | undefined)?.exact ?? "";

  const currentStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Stop the old stream before requesting a new one
    if (currentStreamRef.current) {
      currentStreamRef.current.getTracks().forEach((t) => t.stop());
      currentStreamRef.current = null;
      setStream(null);
    }

    const enableStream = async () => {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia(options);

        if (cancelled) {
          newStream.getTracks().forEach((t) => t.stop());
          return;
        }

        currentStreamRef.current = newStream;
        setStream(newStream);
      } catch (err) {
        console.error("[useUserMediaStream] Error accessing media devices:", err);
      }
    };

    void enableStream();

    return () => {
      cancelled = true;
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach((t) => t.stop());
        currentStreamRef.current = null;
      }
    };
  // Re-run when resolution, fps, or camera device changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, fps, deviceId]);

  return stream;
};
