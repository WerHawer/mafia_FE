import { useTranslation } from "react-i18next";

import emptyScreenBg from "@/assets/images/empty_screen.webp";
import { modalStore } from "@/store/modalStore.ts";
import { ModalNames } from "@/components/Modals/Modal.types.ts";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import { Typography } from "@/UI/Typography";

import styles from "./GamesList.module.scss";

export const EmptyGamesState = () => {
  const { t } = useTranslation();
  const { openModal } = modalStore;

  const handleCreateGame = () => {
    openModal(ModalNames.CreateGameModal);
  };

  return (
    <div
      className={styles.emptyState}
      style={{ backgroundImage: `url(${emptyScreenBg})` }}
    >
      <div className={styles.emptyContent}>
        <Typography variant="h1" className={styles.emptyTitle}>
          {t("emptyState.title")}
        </Typography>
        
        <Typography variant="p" className={styles.emptyDescription}>
          {t("emptyState.description")}
        </Typography>

        <Button
          onClick={handleCreateGame}
          variant={ButtonVariant.Primary}
          size={ButtonSize.Medium}
          className={styles.createGameBtn}
        >
          {t("emptyState.createGame")}
        </Button>
      </div>
    </div>
  );
};
