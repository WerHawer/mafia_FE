import classNames from "classnames";
import { useRef, useState } from "react";
import type { Toast } from "react-hot-toast";

import styles from "./CustomToast.module.scss";

export type ToastTone = "info" | "success" | "warning" | "error" | "gm";

interface CustomToastProps {
  t: Toast;          // forwarded by react-hot-toast
  tone: ToastTone;
  title?: string;
  message: string;
  onDismiss: () => void;
}

const DISMISS_THRESHOLD_PX = 80;

export const CustomToast = ({ t, tone, title, message, onDismiss }: CustomToastProps) => {
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
    if (dragX > DISMISS_THRESHOLD_PX) onDismiss();
    setDragX(0);
    startX.current = null;
  };

  return (
    <div
      className={classNames(styles.toast, styles[tone], {
        [styles.entering]: t.visible,
        [styles.leaving]: !t.visible,
      })}
      style={{
        ["--toast-duration" as never]: `${t.duration ?? 4000}ms`,
        transform: `translateX(${dragX}px)`,
        opacity: dragX > 0 ? 1 - Math.min(0.5, dragX / 200) : undefined,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="status"
      aria-live="polite"
    >
      <div className={styles.accentBar} />

      <div className={styles.iconBox}>
        <ToneIcon tone={tone} />
      </div>

      <div className={styles.body}>
        <div className={styles.title}>{title ?? defaultTitle(tone)}</div>
        <div className={styles.message}>{message}</div>
      </div>

      <button
        type="button"
        className={styles.dismiss}
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        aria-label="Dismiss notification"
      >
        <CloseGlyph />
      </button>

      <div className={styles.lifetime} />
    </div>
  );
};

CustomToast.displayName = "CustomToast";

// ── Tone defaults ──────────────────────────────────────────────
const defaultTitle = (tone: ToastTone): string =>
  ({
    info: "Notice",
    success: "Success",
    warning: "Warning",
    error: "Error",
    gm: "Gamemaster",
  }[tone]);

// ── Tone icons (no emoji — pure SVG) ───────────────────────────
const ToneIcon = ({ tone }: { tone: ToastTone }) => {
  const common = {
    width: 15,
    height: 15,
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (tone === "info")
    return (
      <svg {...common}>
        <circle cx="10" cy="10" r="8" />
        <path d="M10 9v5M10 6.2v.6" />
      </svg>
    );
  if (tone === "gm")
    return (
      <svg {...common}>
        <path d="M3 7l3 3 4-5 4 5 3-3v8H3V7z" />
        <path d="M3 15h14" />
      </svg>
    );
  if (tone === "warning")
    return (
      <svg {...common}>
        <path d="M10 3l8 14H2L10 3z" />
        <path d="M10 9v3.2M10 14.6v.4" />
      </svg>
    );
  if (tone === "success")
    return (
      <svg {...common}>
        <circle cx="10" cy="10" r="8" />
        <path d="M6 10.5l3 3 5-6" />
      </svg>
    );
  // error
  return (
    <svg {...common}>
      <circle cx="10" cy="10" r="8" />
      <path d="M7 7l6 6M13 7l-6 6" />
    </svg>
  );
};

const CloseGlyph = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
    <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
