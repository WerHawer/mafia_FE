import { observer } from "mobx-react-lite";
import ReactModal from "react-modal";

import {
  ModalNames,
  NightResultsModalProps,
} from "@/components/Modals/Modal.types.ts";
import { NightResultsModal } from "@/components/Modals/NightResultsModal/NightResultsModal.tsx";
import { modalStore, MODAL_CLOSE_ANIMATION_MS } from "@/store/modalStore.ts";

import { CreateGameModal } from "./CreateGameModal";
import { EnterPasswordModal } from "./EnterPasswordModal";
import { GameSettingsModal } from "./GameSettingsModal/GameSettingsModal";
import { ConfirmRestartModal } from "./ConfirmRestartModal";
import { ConfirmChangeGMModal } from "./ConfirmChangeGMModal";
import styles from "./ModalBase.module.scss";
import { VoteResultsModal } from "./VoteResultsModal";
import { GhostModeModal } from "./GhostModeModal/GhostModeModal";
import { GameRolesInfoModal } from "./GameRolesInfoModal";
import { RoleTutorialModal } from "./RoleTutorialModal/RoleTutorialModal.tsx";

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
    [ModalNames.GameSettingsModal]: <GameSettingsModal />,
    [ModalNames.ConfirmRestartModal]: <ConfirmRestartModal />,
    [ModalNames.ConfirmChangeGMModal]: <ConfirmChangeGMModal />,
    [ModalNames.GhostModeModal]: <GhostModeModal />,
    [ModalNames.GameRolesInfoModal]: <GameRolesInfoModal />,
    [ModalNames.RoleTutorialModal]: <RoleTutorialModal />,
  };

  return (
    <ReactModal
      isOpen={isModalOpen}
      onRequestClose={closeModal}
      closeTimeoutMS={MODAL_CLOSE_ANIMATION_MS}
      className={{
        base: styles.modal,
        afterOpen: styles.modalAfterOpen,
        beforeClose: styles.modalBeforeClose,
      }}
      overlayClassName={{
        base: styles.overlay,
        afterOpen: styles.overlayAfterOpen,
        beforeClose: styles.overlayBeforeClose,
      }}
      shouldCloseOnOverlayClick={openedModal !== ModalNames.RoleTutorialModal}
    >
      <div>{openedModal && modals[openedModal]}</div>
    </ReactModal>
  );
});
