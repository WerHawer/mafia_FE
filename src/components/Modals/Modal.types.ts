import { Roles } from "@/types/game.types.ts";
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
  GameSettingsModal = "GameSettingsModal",
  ConfirmRestartModal = "ConfirmRestartModal",
  ConfirmChangeGMModal = "ConfirmChangeGMModal",
  GhostModeModal = "GhostModeModal",
  GameRolesInfoModal = "GameRolesInfoModal",
  RoleTutorialModal = "RoleTutorialModal",
}

export type ModalData = {
  [ModalNames.VoteResultModal]: object;
  [ModalNames.NightResultsModal]: NightResultsModalProps;
  [ModalNames.CreateGameModal]: object;
  [ModalNames.EnterPasswordModal]: { gameId: string; onSuccess: () => void };
  [ModalNames.GameSettingsModal]: object;
  [ModalNames.ConfirmRestartModal]: { onConfirm: () => void };
  [ModalNames.ConfirmChangeGMModal]: { onConfirm: () => void };
  [ModalNames.GhostModeModal]: { onConfirm: () => void };
  [ModalNames.GameRolesInfoModal]: object;
  [ModalNames.RoleTutorialModal]: { role: Roles };
};

export type GModalData<T extends ModalNames> = ModalData[T];
