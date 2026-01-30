import { UserId } from "@/types/user.types.ts";

export type NightResultsModalProps = {
  killedPlayer: UserId[];
};

export enum ModalNames {
  VoteResultModal = "VoteResultModal",
  NightResultsModal = "NightResultsModal",
  CreateGameModal = "CreateGameModal",
  EnterPasswordModal = "EnterPasswordModal",
}

export type ModalData = {
  [ModalNames.VoteResultModal]: object; // Assuming object for now as it was
  [ModalNames.NightResultsModal]: NightResultsModalProps;
  [ModalNames.CreateGameModal]: object; // No special data needed to open, maybe initial settings?
  [ModalNames.EnterPasswordModal]: { gameId: string; onSuccess: () => void };
};

export type GModalData<T extends ModalNames> = ModalData[T];
