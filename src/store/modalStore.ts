import { makeAutoObservable, toJS } from "mobx";
import { GModalData, ModalNames } from "@/components/Modals/Modal.types.ts";

class ModalStore {
  _openedModal: ModalNames | null = null;
  _modalData: GModalData<ModalNames> | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  openModal<T extends ModalNames>(modal: T, data?: GModalData<T>) {
    this._openedModal = modal;
    this._modalData = data ?? null;
  }

  closeModal() {
    this._openedModal = null;
    this._modalData = null;
  }

  get isModalOpening() {
    return toJS(this._openedModal !== null);
  }

  get openedModal() {
    return toJS(this._openedModal);
  }

  get modalData() {
    return toJS(this._modalData);
  }

  isModalOpen(modal: ModalNames) {
    return this._openedModal === modal;
  }
}

export const modalStore = new ModalStore();
