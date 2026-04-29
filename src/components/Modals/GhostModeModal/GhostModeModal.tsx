import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { ModalNames } from "@/components/Modals/Modal.types.ts";
import { modalStore } from "@/store/modalStore.ts";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import { Typography } from "@/UI/Typography";

import styles from "./GhostModeModal.module.scss";

export const GhostModeModal = observer(() => {
  const { t } = useTranslation();
  const { closeModal, modalData } = modalStore;
  const data = modalData as { onConfirm: () => void };

  const handleConfirm = () => {
    data.onConfirm?.();
    closeModal();
  };

  return (
    <div className={styles.container}>
      <Typography variant="h2" className={styles.title}>
        {t("ghostMode.title", "Become a Ghost? 👻")}
      </Typography>
      
      <div className={styles.content}>
        <Typography variant="p" className={styles.description}>
          {t("ghostMode.description", "You can now see the roles of all players and their night actions. This knowledge is only for you!")}
        </Typography>
        
        <div className={styles.rules}>
          <Typography variant="span" className={styles.ruleItem}>
            <span>✅</span> {t("ghostMode.rule1", "See all roles and night actions")}
          </Typography>
          <Typography variant="span" className={styles.ruleItem}>
            <span>🚫</span> {t("ghostMode.rule2", "Living players won't see your reactions")}
          </Typography>
          <Typography variant="span" className={styles.ruleItem}>
            <span>🚫</span> {t("ghostMode.rule3", "You cannot go back to normal death mode")}
          </Typography>
        </div>
      </div>

      <div className={styles.actions}>
        <Button
          variant={ButtonVariant.Outline}
          size={ButtonSize.Medium}
          onClick={closeModal}
        >
          {t("cancel")}
        </Button>
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Medium}
          onClick={handleConfirm}
        >
          {t("ghostMode.confirm", "Open Eyes")}
        </Button>
      </div>
    </div>
  );
});
