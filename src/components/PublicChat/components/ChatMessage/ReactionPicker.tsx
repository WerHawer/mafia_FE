import classNames from "classnames";
import { type CSSProperties, forwardRef, useEffect, useState } from "react";

import styles from "./ReactionPicker.module.scss";

const APPLE_CDN =
  "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/";

/** Default reactions exposed in the hover picker. */
export const DEFAULT_REACTIONS: Array<{
  unified: string;
  name: string;
}> = [
  { unified: "1f44d", name: "thumbs up" },
  { unified: "2764-fe0f", name: "heart" },
  { unified: "1f602", name: "joy" },
  { unified: "1f62e", name: "wow" },
  { unified: "1f622", name: "sad" },
  { unified: "1f525", name: "fire" },
  { unified: "1f44e", name: "thumbs down" },
];

interface ReactionPickerProps {
  isMine: boolean;
  onPick: (emojiUnified: string) => void;
  direction: "up" | "down";
  style?: CSSProperties;
  onMouseLeave?: () => void;
}

export const ReactionPicker = forwardRef<HTMLDivElement, ReactionPickerProps>(
  ({ isMine, onPick, direction, style, onMouseLeave }, ref) => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
      const id = setTimeout(() => setOpen(true), 30);
      return () => clearTimeout(id);
    }, []);

    return (
      <div
        ref={ref}
        role="menu"
        className={classNames(styles.picker, {
          [styles.pickerMine]: isMine,
          [styles.pickerUp]: direction === "up",
          [styles.pickerOpen]: open,
        })}
        style={style}
        onMouseLeave={onMouseLeave}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {DEFAULT_REACTIONS.map((r) => (
          <button
            key={r.unified}
            type="button"
            role="menuitem"
            aria-label={r.name}
            title={r.name}
            className={styles.btn}
            onClick={() => onPick(r.unified)}
          >
            <img
              src={`${APPLE_CDN}${r.unified}.png`}
              alt=""
              width={16}
              height={16}
              loading="eager"
              decoding="async"
            />
          </button>
        ))}
      </div>
    );
  }
);

ReactionPicker.displayName = "ReactionPicker";
