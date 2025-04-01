import { Outlet } from "react-router-dom";

import { MainContainer } from "@/components/MainContainer";
import styles from "@/layouts/layout.module.scss";
import { Logo } from "@/UI/Logo";

export const AuthLayout = () => {
  return (
    <div className={styles.rootContainer}>
      <Logo size="large" position="center" className={styles.bigLogo} />

      <MainContainer>
        <Outlet />
      </MainContainer>
    </div>
  );
};
