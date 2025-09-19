import { useConnectionState, useLocalParticipant,useParticipants } from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { memo } from "react";

export const LiveKitDebugInfo = memo(() => {
  const participants = useParticipants();
  const connectionState = useConnectionState();
  const { localParticipant } = useLocalParticipant();

  const debugStyle = {
    position: 'fixed' as const,
    top: '100px',
    right: '10px',
    backgroundColor: 'rgba(0,0,0,0.8)',
    color: 'white',
    padding: '10px',
    fontSize: '12px',
    zIndex: 9999,
    maxWidth: '300px',
    borderRadius: '4px'
  };

  return (
    <div style={debugStyle}>
      <h4>LiveKit Debug Info</h4>
      <p><strong>Connection:</strong> {connectionState}</p>
      <p><strong>Participants:</strong> {participants.length}</p>
      <p><strong>Local Participant:</strong> {localParticipant?.identity || 'None'}</p>

      <h5>Participants List:</h5>
      {participants.map((p, i) => (
        <div key={p.identity} style={{ marginBottom: '5px', fontSize: '11px' }}>
          <strong>{i + 1}. {p.identity}</strong>
          <br />
          - Camera: {p.getTrackPublication('camera')?.isSubscribed ? '✓' : '✗'}
          <br />
          - Microphone: {p.getTrackPublication('microphone')?.isSubscribed ? '✓' : '✗'}
          <br />
          - Is Local: {p.isLocal ? 'Yes' : 'No'}
        </div>
      ))}

      {connectionState !== ConnectionState.Connected && (
        <p style={{ color: 'red' }}>
          <strong>Warning:</strong> Not connected to LiveKit room
        </p>
      )}
    </div>
  );
});

LiveKitDebugInfo.displayName = "LiveKitDebugInfo";
