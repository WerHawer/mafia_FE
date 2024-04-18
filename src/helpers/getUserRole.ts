import { IGameRoles } from "../types/game.types.ts";
import { UserId } from "../types/user.types.ts";

export enum Roles {
  Mafia = "mafia",
  Don = "don",
  Citizens = "citizens",
  Sheriff = "sheriff",
  Doctor = "doctor",
  Maniac = "maniac",
  Prostitute = "prostitute",
  Unknown = "unknown",
}

export const getUserRole = (
  activeGameRoles: Partial<IGameRoles> | null,
  userId: UserId,
) => {
  if (!activeGameRoles) return Roles.Unknown;

  const { mafia, citizens, sheriff, doctor, maniac, prostitute } =
    activeGameRoles;

  if (mafia?.includes(userId)) {
    return mafia[0] === userId ? Roles.Don : Roles.Mafia;
  }

  if (citizens?.includes(userId)) {
    return Roles.Citizens;
  }

  if (sheriff === userId) {
    return Roles.Sheriff;
  }

  if (doctor === userId) {
    return Roles.Doctor;
  }

  if (maniac === userId) {
    return Roles.Maniac;
  }

  if (prostitute === userId) {
    return Roles.Prostitute;
  }

  return Roles.Unknown;
};
