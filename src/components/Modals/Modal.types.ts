import { UserId } from "@/types/user.types.ts";

export type MafiaMissReason =
  | "noShots"
  | "notAllShot"
  | "splitShots"
  | "savedByDoctor";

export type NightActionLogs = {
  targetedByMafia?: string[];
  savedByDoctor?: string;
  blockedByProstitute?: string;
  sheriffChecked?: string;
  donChecked?: string;
  mafiaMissReason?: MafiaMissReason;
  killedPlayer?: string;
  aliveMafiaCount?: number;
  totalShots?: number;
};

export type NightResultsModalProps = {
  nightActionLogs: NightActionLogs;
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
