import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { ModalNames } from "@/components/Modals/Modal.types.ts";
import { modalStore } from "@/store/modalStore.ts";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import { Typography } from "@/UI/Typography";

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
      <Typography variant="sectionHeader">
        {t("confirmRestartModal.title")}
      </Typography>

      <Typography variant="body" className={styles.warning}>
        {t("confirmRestartModal.warning")}
      </Typography>

      <div className={styles.footer}>
        <Button
          variant={ButtonVariant.Outline}
          onClick={closeModal}
          size={ButtonSize.MS}
        >
          {t("confirmRestartModal.cancel")}
        </Button>
        <Button onClick={handleConfirm} size={ButtonSize.MS}>
          {t("confirmRestartModal.confirm")}
        </Button>
      </div>
    </div>
  );
});

ConfirmRestartModal.displayName = "ConfirmRestartModal";
