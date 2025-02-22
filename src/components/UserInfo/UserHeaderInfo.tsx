import { routes } from "@/router/routs.ts";
import { usersStore } from "@/store/usersStore.ts";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import noAvatar from "../../assets/images/noAvatar.jpg";
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
      <div className={styles.avatar}>
        <img src={avatar ?? noAvatar} alt={nikName} width="60" height="60" />
      </div>

      <span className={styles.name}>{nikName}</span>
    </div>
  );
});
