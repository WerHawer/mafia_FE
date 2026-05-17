import { CheckCircleOutlined, ReadOutlined, StopOutlined } from "@ant-design/icons";
import Tippy from "@tippyjs/react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { rootStore } from "@/store/rootStore.ts";
import { UserId } from "@/types/user.types.ts";

import styles from "./TutorialStatusBadge.module.scss";

type TutorialStatusBadgeProps = {
  userId: UserId;
};

export const TutorialStatusBadge = observer(({ userId }: TutorialStatusBadgeProps) => {
  const { t } = useTranslation();
  const { gamesStore, isIGM } = rootStore;
  const { gameFlow, tutorialProgress } = gamesStore;

  const isFirstNight = gameFlow.day === 1 && gameFlow.isNight;

  if (!isIGM || !isFirstNight) return null;

  const progress = tutorialProgress.get(userId);
  if (!progress) return null;

  const { status, slideIndex, totalSlides } = progress;

  if (status === "completed") {
    return (
      <div className={styles.wrapper}>
        <Tippy theme="role-tooltip" content={t("tutorialStatus.completed")}>
          <CheckCircleOutlined className={styles.iconCompleted} />
        </Tippy>
      </div>
    );
  }

  if (status === "skipped") {
    return (
      <div className={styles.wrapper}>
        <Tippy theme="role-tooltip" content={t("tutorialStatus.skipped")}>
          <StopOutlined className={styles.iconSkipped} />
        </Tippy>
      </div>
    );
  }

  // started or advanced
  const slideLabel =
    slideIndex !== undefined && totalSlides !== undefined
      ? `${slideIndex + 1}/${totalSlides}`
      : null;

  return (
    <div className={styles.wrapper}>
      <Tippy
        theme="role-tooltip"
        content={t("tutorialStatus.inProgress", { slide: slideIndex !== undefined ? slideIndex + 1 : 1, total: totalSlides ?? "?" })}
      >
        <div className={styles.inProgressWrapper}>
          <ReadOutlined className={styles.iconInProgress} />
          {slideLabel && <span className={styles.slideCounter}>{slideLabel}</span>}
        </div>
      </Tippy>
    </div>
  );
});

TutorialStatusBadge.displayName = "TutorialStatusBadge";
