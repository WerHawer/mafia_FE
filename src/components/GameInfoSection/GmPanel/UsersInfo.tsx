import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { QuestionCircleOutlined } from "@ant-design/icons";
import styles from "../GameInfoSection.module.scss";
import { gamesStore } from "../../../store/gamesStore.ts";
import { useGetUsersWithAddToStore } from "../../../api/user/queries.ts";
import { usersStore } from "../../../store/usersStore.ts";
import Tippy from "@tippyjs/react";
import { useMemo } from "react";

export const UsersInfo = observer(() => {
  const { activeGameGm, activeGameRoles, activeGamePlayers } = gamesStore;
  const { getUser } = usersStore;
  const { isLoading: isUsersLoading } =
    useGetUsersWithAddToStore(activeGamePlayers);

  const playersWithoutGm = useMemo(
    () => activeGamePlayers.filter((id) => id !== activeGameGm),
    [activeGamePlayers, activeGameGm],
  );

  return (
    <Tippy
      content={
        <ul className={styles.list}>
          {!isUsersLoading && activeGamePlayers
            ? playersWithoutGm.map((id) => (
                <li
                  key={id}
                  className={classNames(styles.roles, {
                    [styles.mafia]: activeGameRoles?.mafia?.includes(id),
                    [styles.citizen]: activeGameRoles?.citizens?.includes(id),
                    [styles.cherif]: activeGameRoles?.cherif === id,
                    [styles.doctor]: activeGameRoles?.doctor === id,
                    [styles.maniac]: activeGameRoles?.maniac === id,
                    [styles.prostitute]: activeGameRoles?.prostitute === id,
                    [styles.gm]: id === activeGameGm,
                  })}
                >
                  {getUser(id).name};
                </li>
              ))
            : null}
        </ul>
      }
    >
      <div className={styles.userRolesTippy}>
        <span>user roles</span>
        <QuestionCircleOutlined />
      </div>
    </Tippy>
  );
});
