import { useContext } from 'react';
import { UserContext } from '../../context/SocketProvider.tsx';
import styles from './UserInfo.module.scss';
import noAvatar from '../../assets/images/noAvatar.jpg';

export const UserHeaderInfo = () => {
  const user = useContext(UserContext);

  if (!user) return null;

  const { name, avatar } = user;

  return (
    <div className={styles.container}>
      <span className={styles.name}>{name}</span>

      <div className={styles.avatar}>
        <img src={avatar ?? noAvatar} alt={name} width="46" height="46" />
      </div>
    </div>
  );
};
