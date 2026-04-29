import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { routes } from "@/router/routs.ts";
import { usersStore } from "@/store/usersStore.ts";
import { UserAvatar } from "@/UI/Avatar/UserAvatar.tsx";

import styles from "./UserInfo.module.scss";

export const UserHeaderInfo = observer(() => {
  const { me: user } = usersStore;
  const navigate = useNavigate();

  if (!user) return null;

  const { nikName, avatar } = user;

  const navigateToSettings = useCallback(() => {
    navigate(routes.settings);
  }, [navigate]);

  return (
    <div className={styles.container} onClick={navigateToSettings}>
      <UserAvatar avatar={avatar} name={nikName} customSize={60} />

      <span className={styles.name}>{nikName}</span>
    </div>
  );
});
