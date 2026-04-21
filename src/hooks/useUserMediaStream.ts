import { useEffect, useRef, useState } from "react";

/**
 * Reactive camera stream hook.
 * Re-requests getUserMedia whenever the constraint dimensions change
 * (e.g. when the user switches quality tier).
 * Previous tracks are stopped before the new request is made.
 */
export const useUserMediaStream = (options: MediaStreamConstraints) => {
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Use width/height as the restart key so we don't re-request on every render
  const video = options.video as MediaTrackConstraints | undefined;
  const width  = (video?.width  as ConstrainULongRange | undefined)?.ideal ?? 0;
  const height = (video?.height as ConstrainULongRange | undefined)?.ideal ?? 0;
  const fps    = (video?.frameRate as ConstrainDoubleRange | undefined)?.ideal ?? 0;

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
  // Re-run only when the actual resolution / fps changes, not on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, fps]);

  return stream;
};
