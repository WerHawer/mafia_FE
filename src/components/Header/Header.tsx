import { LogoutOutlined } from "@ant-design/icons";
import Tippy from "@tippyjs/react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { ModalNames } from "@/components/Modals/Modal.types.ts";
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
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleCreateGame = useCallback(() => {
    openModal(ModalNames.CreateGameModal);
  }, [openModal]);

  const onLogout = useCallback(() => {
    logout();
    removeTokenFromAxios();
    disconnect();
    navigate(routes.login);
  }, [disconnect, logout, navigate]);

  return (
    <header className={styles.header}>
      <Logo size="medium" />

      <HeaderNav />

      <Button
        onClick={handleCreateGame}
        variant={ButtonVariant.Primary}
        size={ButtonSize.Medium}
        uppercase
      >
        {t("createGame")}
      </Button>

      <UserHeaderInfo />

      <Tippy content={t("logout")}>
        <LogoutOutlined onClick={onLogout} className={styles.logoutButton} />
      </Tippy>
    </header>
  );
};

Header.displayName = "Header";
