import classNames from "classnames";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import anna from "@/assets/images/cards/anna.webp";
import cardBack from "@/assets/images/cards/card_back.webp";
import doctor from "@/assets/images/cards/doctor.webp";
import janna from "@/assets/images/cards/janna.webp";
import kate from "@/assets/images/cards/kate.webp";
import ken from "@/assets/images/cards/ken.webp";
import mafia_1 from "@/assets/images/cards/mafia_1.webp";
import mafia_2 from "@/assets/images/cards/mafia_2.webp";
import don from "@/assets/images/cards/mafia_don.webp";
import prostitute from "@/assets/images/cards/prostitute.webp";
import sheriff from "@/assets/images/cards/sheriff.webp";
import taras from "@/assets/images/cards/taras.webp";
import vasyl from "@/assets/images/cards/vasyl.webp";

import { Roles } from "@/types/game.types";
import { Typography } from "@/UI/Typography";

import styles from "./RoleCard.module.scss";

type RoleCardProps = {
  role: Partial<Roles>;
  width?: number;
  height?: number;
  index?: number;
  onClick?: () => void;
};

export const RoleCard = ({
  role = Roles.Sheriff,
  index,
  width,
  height,
  onClick,
}: RoleCardProps) => {
  const { t } = useTranslation();
  const [isFlipped, setIsFlipped] = useState(false);

  const mafia = [don, mafia_1, mafia_2];
  const citizens = [anna, janna, kate, ken, taras, vasyl];

  const roleImages = {
    [Roles.Don]: don,
    [Roles.Sheriff]: sheriff,
    [Roles.Doctor]: doctor,
    [Roles.Mafia]: mafia[index ?? 0],
    [Roles.Citizen]: citizens[index ?? 0],
    [Roles.Prostitute]: prostitute,
  };

  const roleImage = roleImages[role as keyof typeof roleImages];

  const handleClick = useCallback(() => {
    if (isFlipped) return;

    onClick?.();
    setIsFlipped(true);
  }, [isFlipped, onClick]);

  useEffect(() => {
    if (isFlipped) return;

    const cardTimeout = setTimeout(() => handleClick(), 30000);

    return () => clearTimeout(cardTimeout);
  }, [handleClick, isFlipped]);

  const style = {
    width: width ?? "200px",
    height: height ?? "300px",
  };

  if (!roleImage) return null;

  return (
    <div className={styles.container} onClick={handleClick} style={style}>
      <div
        className={classNames(styles.card, {
          [styles.flipped]: isFlipped,
        })}
      >
        <div className={styles.back}>
          <img src={cardBack} alt="card back" className={styles.cardImage} />
        </div>
        <div className={styles.front}>
          <img src={roleImage} alt={role} className={styles.cardImage} />

          <Typography variant="subtitle" className={styles.roleName}>
            {t(`roles.${role}`)}
          </Typography>
        </div>
      </div>
    </div>
  );
};
