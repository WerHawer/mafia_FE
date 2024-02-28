import { useCallback } from 'react';
import { IUser } from './App.tsx';

type UserModalProps = {
  setUser: (user: IUser) => void;
  users?: IUser[];
  user?: IUser;
};

export const UserModal = ({ setUser, users, user }: UserModalProps) => {
  const handleUserClick = useCallback(
    (user: IUser) => () => {
      setUser(user);
    },
    [setUser]
  );

  if (user) return null;

  return (
    <div className="userModal active">
      <div className="userContainer">
        {users
          ? users.map((user) => (
              <div
                key={user.id}
                className="userCard"
                onClick={handleUserClick(user)}
              >
                <p>Name: {user.name}</p>
                <p>Email: {user.email}</p>
              </div>
            ))
          : 'Loading...'}
      </div>
    </div>
  );
};
