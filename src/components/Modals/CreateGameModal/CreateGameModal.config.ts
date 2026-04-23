import { Roles } from "@/types/game.types.ts";

export type FormValues = {
  additionalRoles: Roles[];
  isPrivate: boolean;
  password?: string;
  speakTime: number;
  votesTime: number;
  candidateSpeakTime: number;
};

export const ADDITIONAL_ROLES_OPTIONS = [
  { value: Roles.Doctor, label: "Doctor" },
  { value: Roles.Prostitute, label: "Prostitute" },
];

export const DEFAULT_VALUES: FormValues = {
  additionalRoles: [],
  isPrivate: false,
  password: "",
  speakTime: 60,
  votesTime: 15,
  candidateSpeakTime: 30,
};
