import classNames from "classnames";
import { observer } from "mobx-react-lite";
import styles from "../GameInfoSection.module.scss";
import { gamesStore } from "../../../store/gamesStore.ts";
import { useGetUsersWithAddToStore } from "../../../api/user/queries.ts";
import { usersStore } from "../../../store/usersStore.ts";

export const UsersInfo = observer(() => {
  const { activeGameGm, activeGameRoles, activeGamePlayers } = gamesStore;
  const { getUser } = usersStore;
  const { isLoading: isUsersLoading } =
    useGetUsersWithAddToStore(activeGamePlayers);

  return (
    <ul className={styles.list}>
      {!isUsersLoading && activeGamePlayers
        ? activeGamePlayers.map((id) => (
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
  );
});
