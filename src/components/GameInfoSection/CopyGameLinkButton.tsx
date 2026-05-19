import { CheckOutlined, LinkOutlined } from "@ant-design/icons";
import Tippy from "@tippyjs/react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import styles from "./CopyGameLinkButton.module.scss";

export const CopyGameLinkButton = () => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <Tippy
      content={copied ? t("game.linkCopied") : t("game.copyLink")}
      placement="top"
      theme="role-tooltip"
      animation="scale"
      duration={[200, 150]}
    >
      <button
        className={`${styles.copyButton}${copied ? ` ${styles.copied}` : ""}`}
        onClick={onCopy}
        aria-label={t("game.copyLink")}
        tabIndex={0}
      >
        {copied ? <CheckOutlined /> : <LinkOutlined />}
      </button>
    </Tippy>
  );
};
