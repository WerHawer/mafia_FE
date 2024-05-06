import ReactModal from "react-modal";
import { modalStore } from "@/store/modalStore.ts";
import styles from "./ModalBase.module.scss";
import { VoteResultsModal } from "./VoteResultsModal";
import { ModalNames } from "@/components/Modals/Modal.types.ts";
import { observer } from "mobx-react-lite";
import {
  NightResultsModal,
  NightResultsModalProps,
} from "@/components/Modals/NightResultsModal/NightResultsModal.tsx";
import { VideoConfigModal } from "@/components/Modals/VideoConfigModal/VideoConfigModal.tsx";

ReactModal.setAppElement("#root");

export const ModalFabric = observer(() => {
  const { isModalOpening, closeModal, openedModal, modalData } = modalStore;

  const modals = {
    [ModalNames.VoteResultModal]: <VoteResultsModal />,
    [ModalNames.NightResultsModal]: (
      <NightResultsModal {...(modalData as NightResultsModalProps)} />
    ),
    [ModalNames.VideoConfigModal]: <VideoConfigModal />,
  };

  return (
    <ReactModal
      isOpen={isModalOpening}
      onRequestClose={closeModal}
      className={styles.modal}
      overlayClassName={styles.overlay}
      shouldCloseOnOverlayClick={false}
    >
      <div>{openedModal && modals[openedModal]}</div>
    </ReactModal>
  );
});
