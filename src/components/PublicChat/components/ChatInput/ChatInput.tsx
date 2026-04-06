import { SendOutlined } from "@ant-design/icons";
import classNames from "classnames";
import { ChangeEvent, FormEvent, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/UI/Button";
import { ButtonSize, ButtonType, ButtonVariant } from "@/UI/Button/ButtonTypes";

import styles from "../../PublicChat.module.scss";

interface ChatInputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput = ({ value, onChange, onSubmit, disabled, placeholder }: ChatInputProps) => {
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
      <form onSubmit={disabled ? (e) => e.preventDefault() : handleSubmit}>
        <textarea
          ref={textareaRef}
          className={styles.chatInput}
          value={value}
          onChange={disabled ? undefined : handleChange}
          onKeyDown={disabled ? undefined : handleKeyDown}
          placeholder={placeholder ?? t("typeMessage")}
          rows={1}
          disabled={disabled}
        />

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
    </div>
  );
};
