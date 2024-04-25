import ReactModal from "react-modal";
import { modalStore } from "@/store/modalStore.ts";
import styles from "./ModalBase.module.scss";
import { VoteResultsModal } from "./VoteResultsModal";
import { ModalNames } from "@/components/Modals/Modal.types.ts";
import { observer } from "mobx-react-lite";

ReactModal.setAppElement("#root");

export const ModalFabric = observer(() => {
  const { isModalOpening, closeModal, openedModal } = modalStore;

  const modals = {
    // @ts-ignore
    [ModalNames.VoteResultModal]: <VoteResultsModal />,
  };

  return (
    <ReactModal
      isOpen={isModalOpening}
      onRequestClose={closeModal}
      className={styles.modal}
      overlayClassName={styles.overlay}
    >
      <div>{openedModal && modals[openedModal]}</div>
    </ReactModal>
  );
});
