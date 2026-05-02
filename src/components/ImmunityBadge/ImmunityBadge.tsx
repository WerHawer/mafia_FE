import Tippy from "@tippyjs/react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import shieldIconUrl from "@/assets/icons/shield.svg?url";
import { rootStore } from "@/store/rootStore.ts";
import { UserId } from "@/types/user.types.ts";

import styles from "./ImmunityBadge.module.scss";

type ImmunityBadgeProps = {
  userId: UserId;
};

export const ImmunityBadge = observer(({ userId }: ImmunityBadgeProps) => {
  const { t } = useTranslation();
  const { gamesStore } = rootStore;

  if (!gamesStore.isUserImmune(userId)) return null;

  const label = t("gameVideo.immunityBadge");
  const description = t("gameVideo.immunityBadgeDescription");

  return (
    <Tippy content={description} theme="role-tooltip" delay={[300, 0]}>
      <img
        src={shieldIconUrl}
        alt={label}
        aria-label={label}
        className={styles.badge}
      />
    </Tippy>
  );
});

ImmunityBadge.displayName = "ImmunityBadge";
