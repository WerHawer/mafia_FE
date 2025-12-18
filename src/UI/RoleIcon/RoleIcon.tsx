import Tippy from "@tippyjs/react";
import classNames from "classnames";
import { useTranslation } from "react-i18next";

import citizenIcon from "@/assets/icons/citizen.png";
import doctorIcon from "@/assets/icons/doctor.webp";
import gmIcon from "@/assets/icons/gm.png";
import mafiaIcon from "@/assets/icons/mafia.webp";
import donIcon from "@/assets/icons/mafia_boss.webp";
import maniacIcon from "@/assets/icons/maniac.webp";
import prostituteIcon from "@/assets/icons/prostitute.webp";
import sheriffIcon from "@/assets/icons/sheriff.png";
import { Roles } from "@/types/game.types.ts";

import styles from "./RoleIcon.module.scss";

type RoleIconSize = "s" | "m" | "l";

type RoleIconProps = {
  role: Roles;
  size?: RoleIconSize;
};

export const RoleIcon = ({ role, size = "s" }: RoleIconProps) => {
  const { t } = useTranslation();

  const icons = {
    [Roles.Mafia]: mafiaIcon,
    [Roles.Don]: donIcon,
    [Roles.Citizen]: citizenIcon,
    [Roles.Sheriff]: sheriffIcon,
    [Roles.Doctor]: doctorIcon,
    [Roles.Maniac]: maniacIcon,
    [Roles.Prostitute]: prostituteIcon,
    [Roles.GM]: gmIcon,
    [Roles.Unknown]: undefined,
  };
  const icon = icons[role];

  if (!icon) return null;

  return (
    <Tippy
      content={t(`roles.${role}`)}
      theme="role-tooltip"
      animation="scale"
      duration={[200, 150]}
      delay={[500, 0]}
      placement={role === Roles.GM ? "bottom" : "top"}
    >
      <img
        className={classNames(styles.img, styles[size])}
        src={icons[role]}
        alt={role}
      />
    </Tippy>
  );
};

RoleIcon.displayName = "RoleIcon";
