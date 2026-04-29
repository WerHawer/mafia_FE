import classNames from "classnames";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import emptyScreenBg from "@/assets/images/empty_screen.webp";
import { ModalNames } from "@/components/Modals/Modal.types.ts";
import { modalStore } from "@/store/modalStore.ts";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import { Typography } from "@/UI/Typography";

import styles from "./GamesList.module.scss";

export const EmptyGamesState = () => {
  const { t } = useTranslation();
  const { openModal } = modalStore;
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = emptyScreenBg;
    
    // In case the image is already cached and loaded
    if (img.complete) {
      setImageLoaded(true);
    }
  }, []);

  const handleCreateGame = () => {
    openModal(ModalNames.CreateGameModal);
  };

  return (
    <div className={classNames(styles.emptyState, { [styles.loaded]: imageLoaded })}>
      <div
        className={styles.bgOverlay}
        style={{ backgroundImage: `url(${emptyScreenBg})` }}
      />
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
