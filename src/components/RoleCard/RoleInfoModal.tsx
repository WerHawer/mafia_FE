import { CloseOutlined } from "@ant-design/icons";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { Roles } from "@/types/game.types.ts";
import { Typography } from "@/UI/Typography";

import styles from "./RoleInfoModal.module.scss";

type RoleInfo = {
  color: string;
  prefix: string;
};

const ROLE_INFO: Partial<Record<Roles, RoleInfo>> = {
  [Roles.Mafia]: { color: "#ff4444", prefix: "mafia" },
  [Roles.Don]: { color: "#ff4444", prefix: "don" },
  [Roles.Citizen]: { color: "#58a6ff", prefix: "citizen" },
  [Roles.Sheriff]: { color: "#ffd700", prefix: "sheriff" },
  [Roles.Doctor]: { color: "#52c41a", prefix: "doctor" },
  [Roles.Prostitute]: { color: "#e91e8c", prefix: "prostitute" },
};

// Fixed dimensions of the expanded card
const EXPANDED_WIDTH = 360;

type RoleInfoModalProps = {
  isOpen: boolean;
  role: Partial<Roles>;
  image: string;
  cardRect: DOMRect | null;
  onClose: () => void;
};

export const RoleInfoModal = ({
  isOpen,
  role,
  image,
  cardRect,
  onClose,
}: RoleInfoModalProps) => {
  const { t } = useTranslation();

  const info = ROLE_INFO[role as Roles];

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onKeyDown]);

  if (!info) return null;

  const { color, prefix } = info;

  // Offset from screen center to card center — used as animation origin
  const cardCenterX = cardRect ? cardRect.left + cardRect.width / 2 : window.innerWidth / 2;
  const cardCenterY = cardRect ? cardRect.top + cardRect.height / 2 : window.innerHeight / 2;
  const offsetX = cardCenterX - window.innerWidth / 2;
  const offsetY = cardCenterY - window.innerHeight / 2;
  // Scale so expanded card visually matches the original card size at start
  const scaleFrom = cardRect ? Math.min(cardRect.width / EXPANDED_WIDTH, 0.45) : 0.35;

  return createPortal(
    <div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="role-info-backdrop"
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <div key="role-info-shell" className={styles.centerShell} onClick={onClose}>
            <motion.div
              className={styles.expandedCard}
              initial={{ x: offsetX, y: offsetY, scale: scaleFrom, opacity: 0.85 }}
              animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              exit={{ x: offsetX, y: offsetY, scale: scaleFrom, opacity: 0, transition: { duration: 0.22 } }}
              transition={{ type: "spring", damping: 24, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.imageWrapper}>
                <img src={image} alt={t(`roles.${role}`)} className={styles.image} />
                <span className={styles.nameBadge} style={{ color }}>
                  {t(`roles.${role}`)}
                </span>
              </div>

              <div className={styles.infoSection}>
                <Typography variant="caption" className={styles.tagline}>
                  {t(`rules.roles.${prefix}.tagline`)}
                </Typography>

                <div className={styles.row}>
                  <span className={styles.label}>{t("rules.label.night")}</span>
                  <Typography variant="caption" className={styles.text}>
                    {t(`rules.roles.${prefix}.night`)}
                  </Typography>
                </div>

                <div className={styles.row}>
                  <span className={styles.label}>{t("rules.label.goal")}</span>
                  <Typography variant="caption" className={styles.text}>
                    {t(`rules.roles.${prefix}.goal`)}
                  </Typography>
                </div>

                <div className={styles.tip}>
                  <span className={styles.tipEmoji}>💡</span>
                  <Typography variant="caption" className={styles.tipText}>
                    {t(`rules.roles.${prefix}.tip`)}
                  </Typography>
                </div>
              </div>

              <button
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close"
                tabIndex={0}
              >
                <CloseOutlined />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
};

RoleInfoModal.displayName = "RoleInfoModal";


