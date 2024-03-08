import { useEffect, useState } from 'react';

export const useUserMediaStream = (
  options: MediaStreamConstraints,
  enabled: boolean
) => {
  const [userMediaStream, setMediaStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!enabled || userMediaStream) return;

    console.log('userMediaStream');

    // TODO: think how I can prevent this from being called multiple times. Async fn created 2 streams
    const enableStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(options);

        setMediaStream((prev) => prev ?? stream);
      } catch (err) {
        console.error('Error accessing media devices.', err);
      }
    };

    enableStream();
  }, [options, userMediaStream, enabled]);

  useEffect(() => {
    return () => {
      userMediaStream?.getTracks().forEach((track) => {
        track.stop();
      });

      setMediaStream(null);

      navigator.mediaDevices;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return userMediaStream;
};
