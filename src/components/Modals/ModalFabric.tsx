import { observer } from "mobx-react-lite";
import ReactModal from "react-modal";

import { ModalNames } from "@/components/Modals/Modal.types.ts";
import {
  NightResultsModal,
  NightResultsModalProps,
} from "@/components/Modals/NightResultsModal/NightResultsModal.tsx";
import { modalStore } from "@/store/modalStore.ts";

import styles from "./ModalBase.module.scss";
import { VoteResultsModal } from "./VoteResultsModal";

ReactModal.setAppElement("#root");

export const ModalFabric = observer(() => {
  const { isModalOpening, closeModal, openedModal, modalData } = modalStore;

  const modals = {
    [ModalNames.VoteResultModal]: <VoteResultsModal />,
    [ModalNames.NightResultsModal]: (
      <NightResultsModal {...(modalData as NightResultsModalProps)} />
    ),
  };

  return (
    <ReactModal
      isOpen={isModalOpening}
      onRequestClose={closeModal}
      className={styles.modal}
      overlayClassName={styles.overlay}
      shouldCloseOnOverlayClick
    >
      <div>{openedModal && modals[openedModal]}</div>
    </ReactModal>
  );
});
