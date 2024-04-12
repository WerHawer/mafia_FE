import { observer } from "mobx-react-lite";
import styles from "./GameVideo.module.scss";
import { gamesStore } from "@/store/gamesStore.ts";
import { getUserRole } from "@/helpers/getUserRole.ts";
import { RoleIcon } from "../RoleIcon";
import { usersStore } from "@/store/usersStore.ts";

type VideoUserInfoProps = {
  userName: string;
  userId: string;
};

export const VideoUserInfo = observer(
  ({ userName, userId }: VideoUserInfoProps) => {
    const { myId } = usersStore;
    const { activeGameRoles, isUserGM } = gamesStore;
    const role = getUserRole(activeGameRoles, userId);

    return (
      <div className={styles.userInfo}>
        {isUserGM(myId) && <RoleIcon role={role} />}

        <div className={styles.userName}>{userName}</div>
      </div>
    );
  },
);
