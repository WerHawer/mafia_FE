import { useCallback } from "react";
import { IUser } from "../../types/user";
import styles from "./UserModal.module.scss";
import classNames from "classnames";

type UserModalProps = {
  setUser: (user: IUser) => void;
  users?: IUser[];
  user: IUser | null;
};

export const UserModal = ({ setUser, users, user }: UserModalProps) => {
  const handleUserClick = useCallback(
    (user: IUser) => () => {
      setUser(user);
    },
    [setUser],
  );

  if (user) return null;

  return (
    <div className={classNames(styles.userModal, styles.active)}>
      <div className={styles.userContainer}>
        {users
          ? users.map((user) => (
              <div
                key={user.id}
                className={styles.userCard}
                onClick={handleUserClick(user)}
              >
                <p>Name: {user.name}</p>
                <p>Email: {user.email}</p>
              </div>
            ))
          : "Loading..."}
      </div>
    </div>
  );
};
