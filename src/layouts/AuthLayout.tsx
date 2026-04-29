import { Outlet } from "react-router-dom";

import { MainContainer } from "@/components/MainContainer";
import styles from "@/layouts/layout.module.scss";
import { Logo } from "@/UI/Logo";
import { usePostHogPageView } from "../hooks/usePostHogPageView.ts";

export const AuthLayout = () => {
  usePostHogPageView();
  return (
    <div className={styles.rootContainer}>
      <Logo size="large" position="center" className={styles.bigLogo} />

      <MainContainer>
        <Outlet />
      </MainContainer>
    </div>
  );
};
