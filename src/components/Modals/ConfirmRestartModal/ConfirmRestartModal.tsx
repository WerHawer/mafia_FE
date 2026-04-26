import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { ModalNames } from "@/components/Modals/Modal.types.ts";
import { modalStore } from "@/store/modalStore.ts";
import { Button } from "@/UI/Button";
import { ButtonVariant } from "@/UI/Button/ButtonTypes.ts";

import styles from "./ConfirmRestartModal.module.scss";

export const ConfirmRestartModal = observer(() => {
  const { t } = useTranslation();
  const { modalData, closeModal } = modalStore;

  const data = modalData as { onConfirm: () => void };

  const handleConfirm = () => {
    data?.onConfirm?.();
    closeModal();
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{t("confirmRestartModal.title")}</h2>
      <p className={styles.warning}>{t("confirmRestartModal.warning")}</p>

      <div className={styles.footer}>
        <Button variant={ButtonVariant.Secondary} onClick={closeModal} fullWidth>
          {t("confirmRestartModal.cancel")}
        </Button>
        <Button onClick={handleConfirm} fullWidth>
          {t("confirmRestartModal.confirm")}
        </Button>
      </div>
    </div>
  );
});

ConfirmRestartModal.displayName = "ConfirmRestartModal";
