import { useRef, useState } from "react";
import { useMount, useUnmount } from "react-use";

export const useUserMediaStream = (options: MediaStreamConstraints) => {
  const [userMediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const isFirstRender = useRef(true);

  useMount(() => {
    if (!isFirstRender.current) return;

    isFirstRender.current = false;

    const enableStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(options);

        setMediaStream(stream);
      } catch (err) {
        console.error("Error accessing media devices.", err);
      }
    };

    enableStream();
  });

  useUnmount(() => {
    setMediaStream(null);

    userMediaStream?.getTracks().forEach((track) => {
      track.stop();
    });
  });

  return userMediaStream;
};
