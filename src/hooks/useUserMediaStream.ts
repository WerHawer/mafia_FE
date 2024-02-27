import { useEffect, useState } from 'react';

export const useUserMediaStream = (options: MediaStreamConstraints) => {
  const [userMediaStream, setMediaStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (userMediaStream) return;

    const enableStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(options);
        setMediaStream(stream);
      } catch (err) {
        console.error('Error accessing media devices.', err);
      }
    };

    enableStream();
  }, [userMediaStream, options]);

  return userMediaStream;
};
