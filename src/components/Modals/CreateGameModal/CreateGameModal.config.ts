import { Roles } from "@/types/game.types.ts";

export type FormValues = {
  maxPlayers: number;
  mafiaCount: number;
  additionalRoles: Roles[];
  isPrivate: boolean;
  password?: string;
};

export const ADDITIONAL_ROLES_OPTIONS = [
  { value: Roles.Doctor, label: "Doctor" },
  { value: Roles.Prostitute, label: "Prostitute" },
];

export const MAX_PLAYERS_OPTIONS = [5, 6, 7, 8, 9, 10, 11];
export const MAFIA_COUNT_OPTIONS = [1, 2, 3];

export const DEFAULT_VALUES: FormValues = {
  maxPlayers: 10,
  mafiaCount: 3,
  additionalRoles: [],
  isPrivate: false,
  password: "",
};
