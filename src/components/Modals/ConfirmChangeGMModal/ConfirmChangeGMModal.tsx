import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { modalStore } from "@/store/modalStore.ts";
import { Button } from "@/UI/Button";

import styles from "../ConfirmRestartModal/ConfirmRestartModal.module.scss";

export const ConfirmChangeGMModal = observer(() => {
  const { t } = useTranslation();
  const { modalData, closeModal } = modalStore;

  const data = modalData as { onConfirm: () => void };

  const handleConfirm = () => {
    data?.onConfirm?.();
    closeModal();
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{t("confirmChangeGMModal.title")}</h2>
      <p className={styles.warning}>{t("confirmChangeGMModal.warning")}</p>

      <div className={styles.footer}>
        <Button variant="secondary" onClick={closeModal} fullWidth>
          {t("confirmChangeGMModal.cancel")}
        </Button>
        <Button onClick={handleConfirm} fullWidth>
          {t("confirmChangeGMModal.confirm")}
        </Button>
      </div>
    </div>
  );
});

ConfirmChangeGMModal.displayName = "ConfirmChangeGMModal";
