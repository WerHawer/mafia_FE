import { HeaderNav } from '../Nav';
import { UserHeaderInfo } from '../UserInfo/UserHeaderInfo.tsx';
import styles from './Header.module.scss';

export const Header = () => {
  return (
    <header className={styles.header}>
      <HeaderNav />
      <UserHeaderInfo />
    </header>
  );
};
