import styles from "./UserInfo.module.scss";
import noAvatar from "../../assets/images/noAvatar.jpg";
import { PopupMenu, PopupMenuElement } from "../PopupMenu";
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
        <PopupMenuElement onClick={handleLogout}>Logout</PopupMenuElement>
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
