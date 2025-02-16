import { HeaderNav } from "../Nav";
import { UserHeaderInfo } from "../UserInfo/UserHeaderInfo.tsx";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { Logo } from "@/UI/Logo";
import styles from "./Header.module.scss";

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

Header.displayName = "Header";
