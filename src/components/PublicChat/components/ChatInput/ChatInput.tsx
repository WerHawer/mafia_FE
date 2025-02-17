import { ChangeEvent, FormEvent, useRef } from "react";
import { useTranslation } from "react-i18next";
import styles from "../../PublicChat.module.scss";

interface ChatInputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
}

export const ChatInput = ({ value, onChange, onSubmit }: ChatInputProps) => {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    onSubmit();

    if (textareaRef.current) {
      textareaRef.current.style.height = "45px";
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey || e.ctrlKey) {
        return;
      }

      handleSubmit(e);
    }
  };

  return (
    <div className={styles.chatInputContainer}>
      <form onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className={styles.chatInput}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={t("typeMessage")}
          rows={1}
        />

        <button className={styles.sendButton} disabled={!value} type="submit">
          {t("send")}
        </button>
      </form>
    </div>
  );
};
