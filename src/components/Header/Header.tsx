import { HeaderNav } from "../Nav";
import { UserHeaderInfo } from "../UserInfo/UserHeaderInfo.tsx";
import styles from "./Header.module.scss";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { Logo } from "@/UI/Logo";

export const Header = () => {
  return (
    <header className={styles.header}>
      <Logo size="medium" />
      <HeaderNav />
      <div className={styles.spacer} />
      <UserHeaderInfo />
      <LanguageSwitcher />
    </header>
  );
};
