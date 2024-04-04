import styles from "./UserInfo.module.scss";
import noAvatar from "../../assets/images/noAvatar.jpg";
import { PopupMenu } from "../PopupMenu/PopupMenu.tsx";
import { useCallback } from "react";
import { removeTokenFromAxios } from "../../helpers/removeTokenFromAxios.ts";
import { useNavigate } from "react-router-dom";
import { routes } from "../../router/routs.ts";
import { observer } from "mobx-react-lite";
import { usersStore } from "../../store/usersStore.ts";
import { useSocket } from "../../hooks/useSocket.ts";

export const UserHeaderInfo = observer(() => {
  const { me: user, logout } = usersStore;
  const { disconnect } = useSocket();
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    logout();
    removeTokenFromAxios();
    navigate(routes.login);
    disconnect();
  }, [disconnect, logout, navigate]);

  if (!user) return null;

  const { name, avatar, id } = user;

  return (
    <PopupMenu
      content={
        <p onClick={handleLogout} className={styles.menuElement}>
          Logout
        </p>
      }
    >
      <div className={styles.container}>
        <span className={styles.name}>
          {name}: {id}
        </span>

        <div className={styles.avatar}>
          <img src={avatar ?? noAvatar} alt={name} width="46" height="46" />
        </div>
      </div>
    </PopupMenu>
  );
});
