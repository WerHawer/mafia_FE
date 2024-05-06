import { NightResultsModalProps } from "@/components/Modals/NightResultsModal/NightResultsModal.tsx";

export enum ModalNames {
  VoteResultModal = "VoteResultModal",
  NightResultsModal = "NightResultsModal",
  VideoConfigModal = "VideoConfigModal",
}

export type ModalData = {
  [ModalNames.VoteResultModal]: {};
  [ModalNames.NightResultsModal]: NightResultsModalProps;
  [ModalNames.VideoConfigModal]: {};
};

export type GModalData<T extends ModalNames> = ModalData[T];
