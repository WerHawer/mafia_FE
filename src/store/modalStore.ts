import { makeAutoObservable, toJS } from "mobx";

import { GModalData, ModalNames } from "@/components/Modals/Modal.types.ts";

export const MODAL_CLOSE_ANIMATION_MS = 250;

export class ModalStore {
  _isOpen: boolean = false;
  _openedModal: ModalNames | null = null;
  _modalData: GModalData<ModalNames> | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  openModal<T extends ModalNames>(modal: T, data?: GModalData<T>) {
    this._openedModal = modal;
    this._modalData = data ?? null;
    this._isOpen = true;
  }

  closeModal() {
    this._isOpen = false;
    setTimeout(() => {
      this._openedModal = null;
      this._modalData = null;
    }, MODAL_CLOSE_ANIMATION_MS);
  }

  get isModalOpen() {
    return this._isOpen;
  }

  get openedModal() {
    return toJS(this._openedModal);
  }

  get modalData() {
    return toJS(this._modalData);
  }
}

export const modalStore = new ModalStore();
