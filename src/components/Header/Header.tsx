import { HeaderNav } from '../Nav';
import { UserHeaderInfo } from '../UserInfo/UserHeaderInfo.tsx';
import styles from './Header.module.scss';
import { LanguageSwitcher } from '../LanguageSwitcher';

export const Header = () => {
  return (
    <header className={styles.header}>
      <HeaderNav />
      <div className={styles.spacer} />
      <UserHeaderInfo />
      <LanguageSwitcher />
    </header>
  );
};
