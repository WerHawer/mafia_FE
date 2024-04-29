import citizenIcon from "@/assets/icons/citizen.png";
import donIcon from "@/assets/icons/mafia_boss.webp";
import mafiaIcon from "@/assets/icons/mafia.webp";
import sheriffIcon from "@/assets/icons/sheriff.png";
import doctorIcon from "@/assets/icons/doctor.webp";
import maniacIcon from "@/assets/icons/maniac.webp";
import prostituteIcon from "@/assets/icons/prostitute.webp";
import styles from "./RoleIcon.module.scss";
import Tippy from "@tippyjs/react";
import { Roles } from "@/types/game.types.ts";

export const RoleIcon = ({ role }: { role: Roles }) => {
  const icons = {
    [Roles.Mafia]: mafiaIcon,
    [Roles.Don]: donIcon,
    [Roles.Citizens]: citizenIcon,
    [Roles.Sheriff]: sheriffIcon,
    [Roles.Doctor]: doctorIcon,
    [Roles.Maniac]: maniacIcon,
    [Roles.Prostitute]: prostituteIcon,
    [Roles.Unknown]: undefined,
  };
  const icon = icons[role];

  if (!icon) return null;

  return (
    <Tippy content={role}>
      <img
        className={styles.img}
        src={icons[role]}
        alt={role}
        width={20}
        height={40}
      />
    </Tippy>
  );
};
