import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import mafia1 from "@/assets/images/cards/mafia_1.webp";
import mafia2 from "@/assets/images/cards/mafia_2.webp";
import { useShuffledRoleImages } from "@/hooks/useShuffledRoleImages.ts";
import { rootStore } from "@/store/rootStore.ts";
import { Roles } from "@/types/game.types.ts";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import { Typography } from "@/UI/Typography";

import styles from "./GameRolesInfoModal.module.scss";

type RoleEntry = {
  role: Roles;
  count: number;
  image: string;
  taglineKey: string | null;
};

const RoleInfoCard = ({ entry }: { entry: RoleEntry }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        <img src={entry.image} alt={t(`roles.${entry.role}`)} />
        <div className={styles.cardOverlay}>
          <Typography variant="subtitle" className={styles.roleName}>
            {t(`roles.${entry.role}`)}
          </Typography>
          {entry.taglineKey && (
            <Typography variant="caption" className={styles.tagline}>
              {t(entry.taglineKey)}
            </Typography>
          )}
        </div>
        {entry.count > 1 && (
          <Typography variant="caption" className={styles.badge}>
            ×{entry.count}
          </Typography>
        )}
      </div>
    </div>
  );
};

export const GameRolesInfoModal = observer(() => {
  const { t } = useTranslation();
  const { gamesStore, modalStore } = rootStore;
  const roles = gamesStore.activeGameRoles;
  const { shuffledCitizens, getRoleImages } = useShuffledRoleImages();

  const entries = useMemo((): RoleEntry[] => {
    if (!roles) return [];

    const result: RoleEntry[] = [];
    const roleImages = getRoleImages(0);

    const mafiaCount = roles.mafia?.length ?? 0;
    if (mafiaCount > 0) {
      result.push({
        role: Roles.Mafia,
        count: mafiaCount,
        image: mafia1,
        taglineKey: "rules.roles.mafia.tagline",
      });
    }

    if (roles.sheriff) {
      result.push({
        role: Roles.Sheriff,
        count: 1,
        image: roleImages[Roles.Sheriff],
        taglineKey: "rules.roles.sheriff.tagline",
      });
    }

    if (roles.doctor) {
      result.push({
        role: Roles.Doctor,
        count: 1,
        image: roleImages[Roles.Doctor],
        taglineKey: "rules.roles.doctor.tagline",
      });
    }

    if (roles.prostitute) {
      result.push({
        role: Roles.Prostitute,
        count: 1,
        image: roleImages[Roles.Prostitute],
        taglineKey: "rules.roles.prostitute.tagline",
      });
    }

    if (roles.maniac) {
      result.push({
        role: Roles.Maniac,
        count: 1,
        image: mafia2,
        taglineKey: null,
      });
    }

    const citizenCount = roles.citizens?.length ?? 0;
    if (citizenCount > 0) {
      result.push({
        role: Roles.Citizen,
        count: citizenCount,
        image: shuffledCitizens[0] ?? roleImages[Roles.Citizen],
        taglineKey: "rules.roles.citizen.tagline",
      });
    }

    return result;
  }, [roles, getRoleImages, shuffledCitizens]);

  return (
    <div className={styles.container}>
      <Typography variant="h2" className={styles.title}>
        {t("gameRolesInfo.title")}
      </Typography>

      <div className={styles.cardsRow}>
        {entries.map((entry) => (
          <RoleInfoCard key={entry.role} entry={entry} />
        ))}
      </div>

      <div className={styles.actions}>
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Medium}
          onClick={modalStore.closeModal}
        >
          {t("gameRolesInfo.confirm")}
        </Button>
      </div>
    </div>
  );
});
