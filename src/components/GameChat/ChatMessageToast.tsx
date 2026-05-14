import { Emoji, EmojiStyle } from "emoji-picker-react";
import classNames from "classnames";
import { useEffect, useRef, useState } from "react";

import { parseMessageToSegments } from "@/helpers/parseMessageToSegments.ts";
import { IMessage } from "@/types/message.types.ts";
import { UserAvatar } from "@/UI/Avatar/UserAvatar.tsx";

import styles from "./ChatMessageToast.module.scss";

interface ChatMessageToastProps {
  message: IMessage;
  /** Ms the toast stays visible; drives the bottom progress bar. */
  duration?: number;
  /** Fired when user clicks ✕ or swipes the card past the dismiss threshold. */
  onDismiss?: () => void;
  /** Current notification-sfx mute state (read from rootStore.soundStore). */
  sfxMuted?: boolean;
  /** Toggle the sfx-mute flag — wires to soundStore.toggleChatNotificationMute. */
  onToggleSfx?: () => void;
}

const DISMISS_THRESHOLD_PX = 80;

export const ChatMessageToast = ({
  message,
  duration = 2500,
  onDismiss,
  sfxMuted = false,
  onToggleSfx,
}: ChatMessageToastProps) => {
  const { text, sender, to } = message;
  const { nikName, avatar } = sender;

  const segments = parseMessageToSegments(text);
  const isDeadChat = "id" in to && to.id.endsWith("_dead");

  // ── Swipe-to-dismiss ───────────────────────────────────────────
  const [dragX, setDragX] = useState(0);
  const startX = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (startX.current == null) return;
    setDragX(Math.max(0, e.clientX - startX.current));
  };
  const handlePointerUp = () => {
    if (dragX > DISMISS_THRESHOLD_PX) onDismiss?.();
    setDragX(0);
    startX.current = null;
  };

  return (
    <div
      className={classNames(styles.toast, { [styles.dead]: isDeadChat })}
      style={{
        // We expose `--toast-duration` so the SCSS progress bar can match the
        // host-side timeout exactly without prop-drilling.
        ["--toast-duration" as never]: `${duration}ms`,
        transform: `translateX(${dragX}px)`,
        opacity: dragX > 0 ? 1 - Math.min(0.5, dragX / 200) : 1,
        transition: startX.current ? "none" : "transform 0.2s ease, opacity 0.2s ease",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className={styles.accentBar} />

      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.senderInfo}>
            <UserAvatar
              avatar={avatar}
              name={nikName}
              className={styles.avatar}
              customSize={22}
            />
            <span className={styles.senderName}>{nikName}</span>
          </div>

          {isDeadChat && <span className={styles.deadBadge}>Dead</span>}

          <button
            type="button"
            className={styles.iconBtn}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSfx?.();
            }}
            title={sfxMuted ? "Unmute alerts" : "Mute alerts"}
            aria-label={sfxMuted ? "Unmute alerts" : "Mute alerts"}
          >
            {sfxMuted ? <SoundOff /> : <SoundOn />}
          </button>

          <button
            type="button"
            className={styles.iconBtn}
            onClick={(e) => {
              e.stopPropagation();
              onDismiss?.();
            }}
            title="Dismiss"
            aria-label="Dismiss"
          >
            <CloseGlyph />
          </button>
        </div>

        <div className={styles.messageText}>
          {segments.map((segment, i) =>
            segment.type === "emoji" ? (
              <Emoji
                key={i}
                unified={segment.unified}
                emojiStyle={EmojiStyle.APPLE}
                size={22}
                lazyLoad
              />
            ) : (
              <span key={i}>{segment.value}</span>
            )
          )}
        </div>
      </div>

      <div className={styles.lifetime} />
    </div>
  );
};

ChatMessageToast.displayName = "ChatMessageToast";

// ── Inline icons (no emoji — match the rest of the UI) ──────────
const SoundOn = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M3 6h2l3-2.5v9L5 10H3V6z" fill="currentColor" />
    <path
      d="M10.5 5.5c1 .8 1.5 1.7 1.5 2.5s-.5 1.7-1.5 2.5"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    <path
      d="M12.8 3.5c1.6 1.2 2.4 2.7 2.4 4.5s-.8 3.3-2.4 4.5"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      opacity="0.7"
    />
  </svg>
);

const SoundOff = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M3 6h2l3-2.5v9L5 10H3V6z" fill="currentColor" />
    <path
      d="M10.5 6l4 4M14.5 6l-4 4"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

const CloseGlyph = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
    <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
