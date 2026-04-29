import { DownOutlined } from "@ant-design/icons";
import Tippy from "@tippyjs/react";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { usersStore } from "@/store/usersStore";
import { UserAvatar } from "@/UI/Avatar/UserAvatar.tsx";
import { Typography } from "@/UI/Typography";

import styles from "../../PublicChat.module.scss";

interface ChatHeaderProps {
  socketConnected: number;
}

const OnlineUsersList = observer(() => {
  const { users } = usersStore;
  const onlineUsers = Object.values(users).filter((u) => u.isOnline);

  return (
    <div className={styles.onlineUsersDropdown}>
      {onlineUsers.length > 0 ? (
        onlineUsers.map((user) => (
          <div key={user.id} className={styles.onlineUserItem}>
            <UserAvatar avatar={user.avatar} name={user.nikName} customSize={24} />
            <span className={styles.onlineUserName}>{user.nikName}</span>
          </div>
        ))
      ) : (
        <div className={styles.emptyOnlineList}>No one is online</div>
      )}
    </div>
  );
});

export const ChatHeader = observer(({ socketConnected }: ChatHeaderProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Tippy
      content={<OnlineUsersList />}
      interactive={true}
      trigger="click"
      placement="bottom-start"
      theme="nav-tooltip"
      offset={[0, 10]}
      onShow={() => setIsOpen(true)}
      onHide={() => setIsOpen(false)}
    >
      <Typography variant="span" className={styles.chatHeader}>
        <div className={styles.onlineIndicatorWrapper}>
          <span className={styles.onlineIndicator} />
          {socketConnected} {t("online")}
          <DownOutlined className={classNames(styles.chevron, { [styles.chevronOpen]: isOpen })} />
        </div>
      </Typography>
    </Tippy>
  );
});
