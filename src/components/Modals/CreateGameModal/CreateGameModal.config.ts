import { Roles } from "@/types/game.types.ts";

export type FormValues = {
  additionalRoles: Roles[];
  isPrivate: boolean;
  password?: string;
};

export const ADDITIONAL_ROLES_OPTIONS = [
  { value: Roles.Doctor, label: "Doctor" },
  { value: Roles.Prostitute, label: "Prostitute" },
];

export const DEFAULT_VALUES: FormValues = {
  additionalRoles: [],
  isPrivate: false,
  password: "",
};
