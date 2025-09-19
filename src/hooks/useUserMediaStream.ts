import { useRef, useState } from "react";
import { useMount, useUnmount } from "react-use";

import { streamStore } from "@/store/streamsStore.ts";

export const useUserMediaStream = (options: MediaStreamConstraints) => {
  const isFirstRender = useRef(true);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useMount(() => {
    if (!isFirstRender.current) return;

    isFirstRender.current = false;

    const enableStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(options);

        setStream(stream);
      } catch (err) {
        console.error("Error accessing media devices.", err);
      }
    };

    enableStream();
  });

  useUnmount(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  });

  return stream;
};
