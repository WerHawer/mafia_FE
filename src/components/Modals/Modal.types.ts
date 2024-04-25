export enum ModalNames {
  VoteResultModal = "VoteResultModal",
}

export type ModalData = {
  [ModalNames.VoteResultModal]: {};
};

export type GModalData<T extends ModalNames> = ModalData[T];
