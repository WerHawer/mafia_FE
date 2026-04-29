import { SendOutlined } from "@ant-design/icons";
import Tippy from "@tippyjs/react";
import classNames from "classnames";
import EmojiPicker, {
  Emoji,
  EmojiClickData,
  EmojiStyle,
  Theme,
} from "emoji-picker-react";
import { observer } from "mobx-react-lite";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { Button } from "@/UI/Button";
import { ButtonSize, ButtonType, ButtonVariant } from "@/UI/Button/ButtonTypes";
import { parseMessageToSegments } from "@/helpers/parseMessageToSegments.ts";

import styles from "../../PublicChat.module.scss";

interface ChatInputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}

interface PickerPosition {
  top: number;
  left: number;
}

const PICKER_HEIGHT = 450;
const PICKER_WIDTH = 350;
const PICKER_MARGIN = 8;

// Size (px) of Apple emoji images rendered inside the input mirror.
// Matches the textarea font-size (19px) exactly so it doesn't desync the caret.
const INPUT_EMOJI_SIZE = 19;

export const ChatInput = ({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
}: ChatInputProps) => {
  const { t } = useTranslation();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState<PickerPosition>({
    top: 0,
    left: 0,
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);

  const [caretPosition, setCaretPosition] = useState<number | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const movingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (caretPosition === null) return;
    
    setIsMoving(true);
    
    if (movingTimeoutRef.current) clearTimeout(movingTimeoutRef.current);
    
    movingTimeoutRef.current = setTimeout(() => {
      setIsMoving(false);
    }, 250);

    return () => {
      if (movingTimeoutRef.current) clearTimeout(movingTimeoutRef.current);
    };
  }, [caretPosition, value]); // Trigger on both cursor move and text change

  // Sync the mirror's scroll position with the textarea so Apple emojis
  // stay aligned when the user scrolls a long message (content > 120px).
  const onTextareaScroll = useCallback(() => {
    if (mirrorRef.current && textareaRef.current) {
      mirrorRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  const updateCaret = useCallback(() => {
    if (textareaRef.current) {
      setCaretPosition(textareaRef.current.selectionStart);
    }
  }, []);

  const calculatePosition = useCallback(() => {
    if (!emojiButtonRef.current) return;

    const rect = emojiButtonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Place above the button by default; fall back to below if not enough space
    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;

    let top: number;

    if (spaceAbove >= PICKER_HEIGHT + PICKER_MARGIN) {
      // Open upward
      top = rect.top - PICKER_HEIGHT - PICKER_MARGIN;
    } else if (spaceBelow >= PICKER_HEIGHT + PICKER_MARGIN) {
      // Open downward
      top = rect.bottom + PICKER_MARGIN;
    } else {
      // Not enough space either way — open upward and cap at viewport top
      top = Math.max(PICKER_MARGIN, rect.top - PICKER_HEIGHT - PICKER_MARGIN);
    }

    // Align right edge with button; clamp within viewport
    let left = rect.right - PICKER_WIDTH;

    if (left < PICKER_MARGIN) left = PICKER_MARGIN;
    if (left + PICKER_WIDTH > viewportWidth - PICKER_MARGIN) {
      left = viewportWidth - PICKER_WIDTH - PICKER_MARGIN;
    }

    setPickerPosition({ top, left });
  }, []);

  useEffect(() => {
    if (!showEmojiPicker) return;

    calculatePosition();

    const onClose = (e: MouseEvent) => {
      const target = e.target as Node;
      const pickerEl = document.getElementById("emoji-picker-portal");

      if (
        emojiButtonRef.current?.contains(target) ||
        pickerEl?.contains(target)
      ) {
        return;
      }

      setShowEmojiPicker(false);
    };

    const onScroll = (e: Event) => {
      const pickerEl = document.getElementById("emoji-picker-portal");
      const target = e.target;

      // Ignore scroll events that originate inside the picker itself
      if (pickerEl?.contains(target as Node)) return;

      // Only close if the scrolled element is an ancestor of our button.
      // Scrolling unrelated elements (like chat history) shouldn't close the picker.
      if (
        target instanceof Node &&
        emojiButtonRef.current &&
        !target.contains(emojiButtonRef.current)
      ) {
        return;
      }

      setShowEmojiPicker(false);
    };
    const onResize = () => calculatePosition();

    document.addEventListener("mousedown", onClose);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      document.removeEventListener("mousedown", onClose);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [showEmojiPicker, calculatePosition]);

  // Split value into before and after the caret to render the fake caret exactly at the correct width
  const beforeText =
    caretPosition !== null ? value.slice(0, caretPosition) : value;
  const afterText = caretPosition !== null ? value.slice(caretPosition) : "";
  const beforeSegments = useMemo(
    () => parseMessageToSegments(beforeText),
    [beforeText]
  );
  const afterSegments = useMemo(
    () => parseMessageToSegments(afterText),
    [afterText]
  );

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const ref = textareaRef.current;

    if (!ref) {
      onChange({
        target: { value: value + emojiData.emoji },
      } as ChangeEvent<HTMLTextAreaElement>);

      return;
    }

    const start = ref.selectionStart;
    const end = ref.selectionEnd;
    const before = value.substring(0, start);
    const after = value.substring(end);
    const newValue = before + emojiData.emoji + after;

    onChange({
      target: { value: newValue },
    } as ChangeEvent<HTMLTextAreaElement>);

    setTimeout(() => {
      ref.focus();
      const newPos = start + emojiData.emoji.length;
      ref.setSelectionRange(newPos, newPos);
      updateCaret();

      // Ensure the cursor is visible after inserting emojis
      const lineHeight = 19 * 1.5; // font-size * line-height
      const currentScrollTop = ref.scrollTop;
      const offsetTop = ref.scrollHeight * (newPos / value.length || 0);

      // Simple heuristic: if the cursor might be below the visible area, scroll to it
      if (offsetTop > currentScrollTop + 100) {
        ref.scrollTop = offsetTop - 60;
      }
    }, 0);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    setShowEmojiPicker(false);
    onSubmit();

    if (textareaRef.current) {
      textareaRef.current.style.height = "45px";
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e);

    if (textareaRef.current) {
      const scrollPos = textareaRef.current.scrollTop;
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
      // Restore scroll position after height change to prevent jumping to top
      textareaRef.current.scrollTop = scrollPos;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey || e.ctrlKey) return;
      handleSubmit(e);
    }
  };

  const onToggleEmojiPicker = () => setShowEmojiPicker((prev) => !prev);

  const showFakeCaret =
    isFocused &&
    caretPosition !== null &&
    textareaRef.current?.selectionStart === textareaRef.current?.selectionEnd;

  return (
    <div className={styles.chatInputContainer}>
      <form onSubmit={disabled ? (e) => e.preventDefault() : handleSubmit}>
        <div className={styles.chatInputWrapper}>
          {/* Apple emoji mirror — sits behind the transparent textarea */}
          <div
            ref={mirrorRef}
            className={styles.chatInputMirror}
            aria-hidden="true"
          >
            {beforeSegments.map((segment, i) =>
              segment.type === "emoji" ? (
                <Emoji
                  key={i}
                  unified={segment.unified}
                  emojiStyle={EmojiStyle.APPLE}
                  size={INPUT_EMOJI_SIZE}
                />
              ) : (
                <span key={i}>{segment.value}</span>
              )
            )}

            {showFakeCaret && (
              <span
                className={classNames(styles.fakeCaret, {
                  [styles.moving]: isMoving,
                })}
              />
            )}

            {caretPosition !== null &&
              afterSegments.map((segment, i) =>
                segment.type === "emoji" ? (
                  <Emoji
                    key={i}
                    unified={segment.unified}
                    emojiStyle={EmojiStyle.APPLE}
                    size={INPUT_EMOJI_SIZE}
                  />
                ) : (
                  <span key={i}>{segment.value}</span>
                )
              )}
          </div>

          <textarea
            id="textarea_chat"
            ref={textareaRef}
            className={styles.chatInput}
            value={value}
            onChange={(e) => {
              handleChange(e);
              updateCaret();
            }}
            onKeyDown={disabled ? undefined : handleKeyDown}
            onKeyUp={updateCaret}
            onSelect={updateCaret}
            onFocus={() => {
              setIsFocused(true);
              updateCaret();
            }}
            onBlur={() => setIsFocused(false)}
            onPointerDown={updateCaret}
            onPointerUp={updateCaret}
            onScroll={onTextareaScroll}
            placeholder={placeholder ?? t("typeMessage")}
            rows={1}
            disabled={disabled}
          />

          <button
            ref={emojiButtonRef}
            type="button"
            className={styles.emojiButton}
            disabled={disabled}
            onClick={onToggleEmojiPicker}
            title={t("emoji_smile", "Emoji")}
          >
            <Emoji unified="1f600" emojiStyle={EmojiStyle.APPLE} size={22} />
          </button>
        </div>

        <Button
          size={ButtonSize.Small}
          disabled={!value || disabled}
          type={ButtonType.Submit}
          variant={ButtonVariant.Outline}
          title={t("send")}
          width="min-content"
          className={styles.sendButton}
          rounded
        >
          <SendOutlined className={styles.icon} />
        </Button>
      </form>

      {showEmojiPicker &&
        createPortal(
          <div
            id="emoji-picker-portal"
            style={{
              position: "fixed",
              top: pickerPosition.top,
              left: pickerPosition.left,
              zIndex: 9999,
            }}
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={Theme.DARK}
              lazyLoadEmojis
              emojiStyle={EmojiStyle.APPLE}
            />
          </div>,
          document.body
        )}
    </div>
  );
};
