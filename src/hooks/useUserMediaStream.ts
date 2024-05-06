import { useRef } from "react";
import { useMount, useUnmount } from "react-use";
import { streamStore } from "@/store/streamsStore.ts";

export const useUserMediaStream = (options: MediaStreamConstraints) => {
  const isFirstRender = useRef(true);
  const { setMyStream, resetMyStream, setMyOriginalStream } = streamStore;

  useMount(() => {
    if (!isFirstRender.current) return;

    isFirstRender.current = false;

    const enableStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(options);

        setMyOriginalStream(stream);
      } catch (err) {
        console.error("Error accessing media devices.", err);
      }
    };

    enableStream();
  });

  // useUnmount(() => {
  //   resetMyStream();
  // });
};
