import { Participant } from "livekit-client";
import { useEffect, useRef, useState } from "react";

const SPEAKING_TIMEOUT = 700; // milliseconds

/**
 * Hook to detect if a participant is currently speaking based on audio level
 * Border stays visible for 0.5s after speaking stops
 */
export const useIsSpeaking = (participant: Participant | undefined) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!participant) {
      setIsSpeaking(false);

      // Clear timeout on cleanup
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      return;
    }

    const handleSpeakingChanged = (speaking: boolean) => {
      // Start speaking - clear any pending timeout and show border immediately
      if (speaking) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setIsSpeaking(true);

        return;
      }

      // Stop speaking - hide border after timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setIsSpeaking(false);
        timeoutRef.current = null;
      }, SPEAKING_TIMEOUT);
    };

    // Subscribe to speaking events
    participant.on("isSpeakingChanged", handleSpeakingChanged);

    // Set initial state
    if (participant.isSpeaking) {
      setIsSpeaking(true);
    }

    return () => {
      participant.off("isSpeakingChanged", handleSpeakingChanged);

      // Clear timeout on cleanup
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [participant]);

  return isSpeaking;
};
