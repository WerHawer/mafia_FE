import { Typography } from "@/UI/Typography";
import { useTranslation } from "react-i18next";
import styles from "../../PublicChat.module.scss";

interface ChatHeaderProps {
  socketConnected: number;
}

export const ChatHeader = ({ socketConnected }: ChatHeaderProps) => {
  const { t } = useTranslation();

  return (
    <Typography variant="span" className={styles.chatHeader}>
      <span className={styles.onlineIndicator} />
      {socketConnected} {t("online")}
    </Typography>
  );
};
