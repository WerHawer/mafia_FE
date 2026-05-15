import classNames from "classnames";
import { AnimatePresence, motion } from "framer-motion";
import { type MutableRefObject, useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

import { UserAvatar } from "@/UI/Avatar/UserAvatar.tsx";

import styles from "./MessageReactions.module.scss";
import { ReactionPicker } from "./ReactionPicker";

const APPLE_CDN =
  "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/";

const HOVER_OPEN_DELAY_MS = 350;
const HOVER_CLOSE_HYSTERESIS_MS = 150;
const PICKER_HEIGHT = 32;
const TOOLTIP_DELAY_MS = 700;

export type ReactorLookup = (userId: string) => {
  nikName: string;
  avatar?: string | null;
} | null;

interface ReactionsLayerProps {
  reactions: Record<string, string[]> | undefined;
  currentUserId: string;
  isMine: boolean;
  resolveUser: ReactorLookup;
  onToggle: (emojiUnified: string) => void;
  hoverTargetRef: React.RefObject<HTMLElement>;
  closePickerRef?: MutableRefObject<(() => void) | null>;
}

const findScrollParent = (el: HTMLElement): HTMLElement | null => {
  let node: HTMLElement | null = el.parentElement;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
    node = node.parentElement;
  }
  return null;
};

export const MessageReactions = ({
  reactions,
  currentUserId,
  isMine,
  resolveUser,
  onToggle,
  hoverTargetRef,
  closePickerRef,
}: ReactionsLayerProps) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerDirection, setPickerDirection] = useState<"up" | "down">("down");
  const [pickerStyle, setPickerStyle] = useState<CSSProperties>({});
  const [tooltipEmoji, setTooltipEmoji] = useState<string | null>(null);

  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref to the picker DOM node (via forwardRef) — used for relatedTarget check
  const pickerDomRef = useRef<HTMLDivElement>(null);
  // Whether the mouse is currently over a chip (to suppress picker opening)
  const isOverChipRef = useRef(false);
  const chipRowRef = useRef<HTMLDivElement>(null);

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setPickerOpen(false), HOVER_CLOSE_HYSTERESIS_MS);
  }, []);

  useEffect(() => {
    if (closePickerRef) {
      closePickerRef.current = () => {
        if (openTimer.current) {
          clearTimeout(openTimer.current);
          openTimer.current = null;
        }
        setPickerOpen(false);
      };
    }
  }, [closePickerRef]);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const openPickerAtPosition = useCallback(() => {
    const target = hoverTargetRef.current;
    if (!target) return;
    const rect = target.getBoundingClientRect();

    const horizontalPos = isMine
      ? { left: undefined as undefined, right: window.innerWidth - rect.right }
      : { left: rect.left, right: undefined as undefined };

    const scrollParent = findScrollParent(target);
    const lowerBound = scrollParent
      ? scrollParent.getBoundingClientRect().bottom
      : window.innerHeight;

    const chipRow = chipRowRef.current;
    const chipRect = chipRow?.getBoundingClientRect();

    // Use chip row bottom as the reference point if chips exist, otherwise bubble bottom
    const refBottom = chipRect ? chipRect.bottom : rect.bottom;
    const isUp = lowerBound - refBottom < PICKER_HEIGHT + 8;

    setPickerDirection(isUp ? "up" : "down");
    setPickerStyle({
      position: "fixed",
      ...(isUp
        ? { top: undefined, bottom: window.innerHeight - rect.top - 1 }
        : { top: chipRect ? chipRect.top : rect.bottom - 1, bottom: undefined }),
      ...horizontalPos,
    });

    setPickerOpen(true);
  }, [hoverTargetRef, isMine]);

  useEffect(() => {
    const target = hoverTargetRef.current;
    if (!target) return;

    const onEnter = () => {
      cancelClose();
      if (!isOverChipRef.current) {
        // Only start open timer if picker is not already open
        setPickerOpen((prev) => {
          if (!prev) {
            openTimer.current = setTimeout(openPickerAtPosition, HOVER_OPEN_DELAY_MS);
          }
          return prev;
        });
      }
    };

    const onLeave = (e: MouseEvent) => {
      // If mouse moved directly to the picker, don't start the close timer
      if (pickerDomRef.current?.contains(e.relatedTarget as Node)) return;

      if (openTimer.current) {
        clearTimeout(openTimer.current);
        openTimer.current = null;
      }
      scheduleClose();
    };

    target.addEventListener("mouseenter", onEnter);
    target.addEventListener("mouseleave", onLeave);
    return () => {
      target.removeEventListener("mouseenter", onEnter);
      target.removeEventListener("mouseleave", onLeave);
      if (openTimer.current) clearTimeout(openTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [hoverTargetRef, cancelClose, scheduleClose, openPickerAtPosition]);

  // Close picker on scroll (fixed picker would drift)
  useEffect(() => {
    if (!pickerOpen) return;
    const onScroll = () => setPickerOpen(false);
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", onScroll, { capture: true });
  }, [pickerOpen]);

  const handlePick = (emojiUnified: string) => {
    onToggle(emojiUnified);
    setPickerOpen(false);
  };

  // Chips are inside the bubble so bubble.mouseleave doesn't fire on chip hover.
  // We only need chip events to suppress the open timer while hovering chips.
  const handleChipMouseEnter = useCallback(() => {
    isOverChipRef.current = true;
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
  }, []);

  const handleChipMouseLeave = useCallback(() => {
    isOverChipRef.current = false;
    // Re-queue open timer only if picker isn't open
    setPickerOpen((prev) => {
      if (!prev) {
        openTimer.current = setTimeout(openPickerAtPosition, HOVER_OPEN_DELAY_MS);
      }
      return prev;
    });
  }, [openPickerAtPosition]);

  const entries = Object.entries(reactions ?? {}).filter(
    ([, users]) => users.length > 0
  );

  return (
    <>
      <AnimatePresence initial={false}>
        {entries.length > 0 && (
        <motion.div
          ref={chipRowRef}
          key="chip-row"
          className={classNames(styles.chipRow, {
            [styles.chipRowMine]: isMine,
          })}
          initial={{ height: 0, opacity: 0, marginTop: 0 }}
          animate={{ height: "auto", opacity: 1, marginTop: 5 }}
          exit={{ height: 0, opacity: 0, marginTop: 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          {entries.map(([emojiUnified, users]) => {
            const count = users.length;
            const mineReacted = users.includes(currentUserId);
            const tooltipUsers = users
              .slice(0, 8)
              .map((uid) => ({ uid, user: resolveUser(uid) }));
            const extra = users.length - tooltipUsers.length;

            return (
              <button
                key={emojiUnified}
                type="button"
                className={classNames(styles.chip, {
                  [styles.chipMine]: mineReacted,
                })}
                onClick={() => { isOverChipRef.current = false; onToggle(emojiUnified); }}
                onMouseEnter={() => {
                  handleChipMouseEnter();
                  tooltipTimer.current = setTimeout(
                    () => setTooltipEmoji(emojiUnified),
                    TOOLTIP_DELAY_MS
                  );
                }}
                onMouseLeave={() => {
                  if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
                  setTooltipEmoji(null);
                  handleChipMouseLeave();
                }}
                aria-label={mineReacted ? "Remove your reaction" : "Add your reaction"}
              >
                <img
                  src={`${APPLE_CDN}${emojiUnified}.png`}
                  alt=""
                  width={16}
                  height={16}
                  className={styles.chipEmoji}
                />
                {count > 1 && (
                  <span className={styles.chipCount}>{count}</span>
                )}

                {tooltipEmoji === emojiUnified && (
                  <div
                    className={classNames(styles.tooltip, {
                      [styles.tooltipMine]: isMine,
                    })}
                  >
                    {tooltipUsers.map(({ uid, user }) =>
                      user ? (
                        <div key={uid} className={styles.tooltipUser}>
                          <UserAvatar
                            name={user.nikName}
                            avatar={user.avatar}
                            customSize={20}
                          />
                          <span>{user.nikName}</span>
                        </div>
                      ) : null
                    )}
                    {extra > 0 && (
                      <span className={styles.tooltipExtra}>+{extra}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </motion.div>
        )}
      </AnimatePresence>

      {pickerOpen &&
        createPortal(
          <ReactionPicker
            ref={pickerDomRef}
            isMine={isMine}
            onPick={handlePick}
            direction={pickerDirection}
            style={pickerStyle}
            onMouseLeave={scheduleClose}
          />,
          document.body
        )}
    </>
  );
};
