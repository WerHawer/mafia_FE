import { Button } from "../../UI/Button";
import { useCallback } from "react";
import { v4 as uuid } from "uuid";
import { useNavigate } from "react-router-dom";
import { routes } from "../../router/routs.ts";
import { useTranslation } from "react-i18next";
import { ButtonSize, ButtonVariant } from "../../UI/Button/Button.tsx";

export const LobbyPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleCreateGame = useCallback(() => {
    const id = uuid();

    navigate(`${routes.game}/${id}`);
  }, [navigate]);

  return (
    <div>
      <h1>Lobby</h1>

      <Button
        onClick={handleCreateGame}
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Large}
        uppercase
      >
        {t("createGame")}
      </Button>
    </div>
  );
};
