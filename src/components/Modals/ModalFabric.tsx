import { observer } from "mobx-react-lite";
import ReactModal from "react-modal";

import {
  ModalNames,
  NightResultsModalProps,
} from "@/components/Modals/Modal.types.ts";
import { NightResultsModal } from "@/components/Modals/NightResultsModal/NightResultsModal.tsx";
import { modalStore } from "@/store/modalStore.ts";

import { CreateGameModal } from "./CreateGameModal";
import { EnterPasswordModal } from "./EnterPasswordModal";
import styles from "./ModalBase.module.scss";
import { VoteResultsModal } from "./VoteResultsModal";

ReactModal.setAppElement("#root");

export const ModalFabric = observer(() => {
  const { isModalOpen, closeModal, openedModal, modalData } = modalStore;

  const modals = {
    [ModalNames.VoteResultModal]: <VoteResultsModal />,
    [ModalNames.NightResultsModal]: (
      <NightResultsModal {...(modalData as NightResultsModalProps)} />
    ),
    [ModalNames.CreateGameModal]: <CreateGameModal />,
    [ModalNames.EnterPasswordModal]: <EnterPasswordModal />,
  };

  return (
    <ReactModal
      isOpen={isModalOpen}
      onRequestClose={closeModal}
      className={styles.modal}
      overlayClassName={styles.overlay}
      shouldCloseOnOverlayClick
    >
      <div>{openedModal && modals[openedModal]}</div>
    </ReactModal>
  );
});
