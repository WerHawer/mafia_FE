import { NightResultsModalProps } from "@/components/Modals/NightResultsModal/NightResultsModal.tsx";

export enum ModalNames {
  VoteResultModal = "VoteResultModal",
  NightResultsModal = "NightResultsModal",
}

export type ModalData = {
  [ModalNames.VoteResultModal]: {};
  [ModalNames.NightResultsModal]: NightResultsModalProps;
};

export type GModalData<T extends ModalNames> = ModalData[T];
