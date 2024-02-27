import { useEffect, useState } from 'react';

export const useUserMediaStream = (
  options: MediaStreamConstraints,
  enabled: boolean
) => {
  const [userMediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isStreamConnected, setIsStreamConnected] = useState(false);

  useEffect(() => {
    if (!enabled || isStreamConnected) return;

    const enableStream = async () => {
      try {
        setIsStreamConnected(true);

        const stream = await navigator.mediaDevices.getUserMedia(options);
        setMediaStream(stream);
      } catch (err) {
        setIsStreamConnected(false);
        console.error('Error accessing media devices.', err);
      }
    };

    enableStream();
  }, [options, enabled, isStreamConnected]);

  return userMediaStream;
};
