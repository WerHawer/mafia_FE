import { useCreateGameMutation } from "@/api/game/queries.ts";
import { createGameObj } from "@/helpers/createGameObj.ts";
import { removeTokenFromAxios } from "@/helpers/removeTokenFromAxios.ts";
import { useSocket } from "@/hooks/useSocket.ts";
import { routes } from "@/router/routs.ts";
import { usersStore } from "@/store/usersStore.ts";
import { Button } from "@/UI/Button/Button.tsx";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import { Logo } from "@/UI/Logo";
import { LogoutOutlined } from "@ant-design/icons";
import Tippy from "@tippyjs/react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { HeaderNav } from "../Nav";
import { UserHeaderInfo } from "../UserInfo/UserHeaderInfo.tsx";
import styles from "./Header.module.scss";

export const Header = () => {
  const { mutate: createGame } = useCreateGameMutation();
  const { logout, myId } = usersStore;
  const { disconnect } = useSocket();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleCreateGame = useCallback(() => {
    if (!myId) return;

    const game = createGameObj({ owner: myId });

    createGame(game, {
      onSuccess: ({ data }) => {
        navigate(`${routes.game}/${data.id}`);
      },
    });
  }, [createGame, navigate, myId]);

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
