import { IGameRoles } from "../types/game.types.ts";
import { UserId } from "../types/user.types.ts";

export enum Roles {
  Mafia = "mafia",
  Don = "don",
  Citizen = "citizen",
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

  if (activeGameRoles.mafia?.includes(userId)) {
    return activeGameRoles.mafia[0] === userId ? Roles.Don : Roles.Mafia;
  }

  if (activeGameRoles.citizens?.includes(userId)) {
    return Roles.Citizen;
  }

  if (activeGameRoles.sheriff === userId) {
    return Roles.Sheriff;
  }

  if (activeGameRoles.doctor === userId) {
    return Roles.Doctor;
  }

  if (activeGameRoles.maniac === userId) {
    return Roles.Maniac;
  }

  if (activeGameRoles.prostitute === userId) {
    return Roles.Prostitute;
  }

  return Roles.Unknown;
};
