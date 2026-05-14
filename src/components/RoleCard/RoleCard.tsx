import { InfoCircleOutlined } from "@ant-design/icons";
import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useShuffledRoleImages } from "@/hooks/useShuffledRoleImages.ts";
import { rootStore } from "@/store/rootStore.ts";
import { SoundEffect } from "@/store/soundStore.ts";
import { Typography } from "@/UI/Typography";
import { Roles } from "@/types/game.types";

import styles from "./RoleCard.module.scss";
import { RoleInfoModal } from "./RoleInfoModal.tsx";

type RoleCardProps = {
  role: Partial<Roles>;
  width?: number;
  height?: number;
  index?: number;
  initialFlipped?: boolean;
  onClick?: () => void;
};

export const RoleCard = ({
  role = Roles.Sheriff,
  index,
  width,
  height,
  initialFlipped = false,
  onClick,
}: RoleCardProps) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(initialFlipped);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [cardRect, setCardRect] = useState<DOMRect | null>(null);

  const { cardBack, getRoleImages } = useShuffledRoleImages();
  const roleImages = getRoleImages(index);
  const roleImage = roleImages[role as keyof typeof roleImages];

  const handleClick = useCallback(() => {
    if (isFlipped) return;

    rootStore.soundStore.playSfx(SoundEffect.Deal);
    onClick?.();
    setIsFlipped(true);
  }, [isFlipped, onClick]);

  useEffect(() => {
    if (isFlipped) return;

    const cardTimeout = setTimeout(() => handleClick(), 30000);

    return () => clearTimeout(cardTimeout);
  }, [handleClick, isFlipped]);

  const onInfoClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (containerRef.current) {
      setCardRect(containerRef.current.getBoundingClientRect());
    }
    setIsInfoOpen(true);
  }, []);

  const onInfoClose = useCallback(() => {
    setIsInfoOpen(false);
  }, []);

  const style = {
    width: width ?? "200px",
    height: height ?? "300px",
  };

  if (!roleImage) return null;

  return (
    <div
      className={styles.container}
      onClick={handleClick}
      style={style}
      ref={containerRef}
    >
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

          {isFlipped && (
            <button
              className={styles.infoBtn}
              onClick={onInfoClick}
              aria-label="Role info"
              tabIndex={0}
            >
              <InfoCircleOutlined />
            </button>
          )}
        </div>
      </div>

      <RoleInfoModal
        isOpen={isInfoOpen}
        role={role}
        image={roleImage}
        cardRect={cardRect}
        onClose={onInfoClose}
      />
    </div>
  );
};
