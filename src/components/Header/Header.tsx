import { LogoutOutlined } from "@ant-design/icons";
import Tippy from "@tippyjs/react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { LanguageSwitcher } from "@/components/LanguageSwitcher/LanguageSwitcher.tsx";
import { ModalNames } from "@/components/Modals/Modal.types.ts";
import { userLogout } from "@/api/auth/api.ts";
import { removeTokenFromAxios } from "@/helpers/removeTokenFromAxios.ts";
import { useSocket } from "@/hooks/useSocket.ts";
import { routes } from "@/router/routs.ts";
import { modalStore } from "@/store/modalStore.ts";
import { usersStore } from "@/store/usersStore.ts";
import { Button } from "@/UI/Button/Button.tsx";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import { Logo } from "@/UI/Logo";

import { HeaderNav } from "../Nav";
import { UserHeaderInfo } from "../UserInfo/UserHeaderInfo.tsx";
import styles from "./Header.module.scss";

export const Header = () => {
  const { logout } = usersStore;
  const { openModal } = modalStore;
  const { disconnect } = useSocket();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleCreateGame = useCallback(() => {
    openModal(ModalNames.CreateGameModal);
  }, [openModal]);

  const onLogout = useCallback(async () => {
    try {
      // Call the BE logout endpoint first while the token is still in Axios.
      // This allows the BE to explicitly disconnect the socket and skip the 30s grace period.
      await userLogout();
    } catch (error) {
      console.error("Failed to notify backend about logout:", error);
    }

    logout();
    removeTokenFromAxios();
    // Clear all TanStack Query cache to prevent stale user/online-status data
    // from leaking into the next user's session.
    queryClient.clear();
    disconnect();
    navigate(routes.login);
  }, [disconnect, logout, navigate, queryClient]);

  return (
    <header className={styles.header}>
      <Logo size="medium" />

      <HeaderNav />

      <LanguageSwitcher />

      <Button
        onClick={handleCreateGame}
        variant={ButtonVariant.Primary}
        size={ButtonSize.Medium}
        uppercase
      >
        {t("createGame")}
      </Button>

      <UserHeaderInfo />

      <Tippy content={t("logout")} theme="nav-tooltip" delay={[500, 0]}>
        <LogoutOutlined onClick={onLogout} className={styles.logoutButton} />
      </Tippy>
    </header>
  );
};

Header.displayName = "Header";
