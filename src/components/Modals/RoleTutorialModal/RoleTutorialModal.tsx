import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useUpdateUserSettingsMutation } from "@/api/user/useUpdateUserSettingsMutation.ts";
import doctorImage from "@/assets/images/roles_modals/doctor_modal.webp";
import madamImage from "@/assets/images/roles_modals/madam_modal.webp";
import donImage from "@/assets/images/roles_modals/mafia_modal.webp";
import mafiaImage from "@/assets/images/roles_modals/mafia_modal.webp";
import sheriffImage from "@/assets/images/roles_modals/sheriff_modal.webp";
import { wsEvents } from "@/config/wsEvents.ts";
import { useSocket } from "@/hooks/useSocket.ts";
import { modalStore } from "@/store/modalStore.ts";
import { rootStore } from "@/store/rootStore.ts";
import { Roles, TutorialProgressStatus } from "@/types/game.types.ts";
import { Button } from "@/UI/Button";
import {
  ButtonSize,
  ButtonType,
  ButtonVariant,
} from "@/UI/Button/ButtonTypes.ts";

import { ROLE_TUTORIAL_BUBBLES } from "./roleTutorialContent.ts";
import styles from "./RoleTutorialModal.module.scss";

const STREAM_CHAR_INTERVAL_MS = 18;

const ROLE_IMAGES: Partial<Record<Roles, string>> = {
  [Roles.Don]: donImage,
  [Roles.Mafia]: mafiaImage,
  [Roles.Sheriff]: sheriffImage,
  [Roles.Doctor]: doctorImage,
  [Roles.Prostitute]: madamImage,
};

const ROLE_ACCENT: Partial<Record<Roles, string>> = {
  [Roles.Don]: "#e8c16a",
  [Roles.Mafia]: "#c0392b",
  [Roles.Sheriff]: "#f5b731",
  [Roles.Doctor]: "#e74c3c",
  [Roles.Prostitute]: "#e91e8c",
};

export const RoleTutorialModal = observer(() => {
  const { t } = useTranslation();
  const { closeModal, modalData } = modalStore;
  const { role } = modalData as { role: Roles };
  const { usersStore, gamesStore } = rootStore;
  const { myId } = usersStore;
  const { activeGameId } = gamesStore;
  const { sendMessage } = useSocket();

  const bubble = ROLE_TUTORIAL_BUBBLES[role];
  const slides = t(`game.roleTutorial.slides.${role}`, {
    returnObjects: true,
    defaultValue: [],
  }) as string[];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [visibleChars, setVisibleChars] = useState(0);
  const viewedSlidesRef = useRef<Set<number>>(new Set());

  const currentText = slides[currentSlide] ?? "";
  const isStreaming = visibleChars < currentText.length;

  useEffect(() => {
    if (viewedSlidesRef.current.has(currentSlide)) {
      setVisibleChars(currentText.length);
      return;
    }

    setVisibleChars(0);
    const id = window.setInterval(() => {
      setVisibleChars((prev) => {
        if (prev >= currentText.length) {
          window.clearInterval(id);
          return prev;
        }
        return prev + 1;
      });
    }, STREAM_CHAR_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [currentSlide, currentText]);

  useEffect(() => {
    if (visibleChars >= currentText.length && currentText.length > 0) {
      viewedSlidesRef.current.add(currentSlide);
    }
  }, [visibleChars, currentText.length, currentSlide]);

  const { mutate: updateSettings } = useUpdateUserSettingsMutation();

  const isLastSlide = currentSlide === slides.length - 1;
  const accent = ROLE_ACCENT[role] ?? "#ffffff";
  const bgImage = ROLE_IMAGES[role];

  const emitProgress = useCallback((status: TutorialProgressStatus, slideIndex = currentSlide) => {
    if (!activeGameId || !myId) return;
    sendMessage(wsEvents.roleTutorialProgress, {
      gameId: activeGameId,
      userId: myId,
      status,
      slideIndex,
      totalSlides: slides.length,
    });
  }, [activeGameId, myId, currentSlide, slides.length, sendMessage]);

  useEffect(() => {
    emitProgress("started", 0);
    // emit only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sessionKey = activeGameId ? `roleTutorial_${activeGameId}_${role}` : null;

  const handleNext = () => {
    if (isStreaming) {
      setVisibleChars(currentText.length);
      return;
    }
    if (isLastSlide) {
      emitProgress("completed");
      if (sessionKey) sessionStorage.setItem(sessionKey, "completed");
      handleClose();
    } else {
      const nextSlide = currentSlide + 1;
      emitProgress("advanced", nextSlide);
      setCurrentSlide(nextSlide);
    }
  };

  const handleSkip = () => {
    emitProgress("skipped");
    if (sessionKey) sessionStorage.setItem(sessionKey, "skipped");
    handleClose();
  };

  const handleClose = () => {
    if (dontShowAgain && myId) {
      updateSettings({ userId: myId, showRoleTutorial: false });
    }
    closeModal();
  };

  if (!bubble || !bgImage || slides.length === 0) return null;

  const { side: tailSide, ...tailStyle } = bubble.tail;
  const bubbleStyle = bubble.wrap;

  return (
    <div className={styles.container}>
      <img
        src={bgImage}
        alt=""
        className={classNames(styles.bgImage, {
          [styles.bgImageMirrored]: role === Roles.Don,
        })}
      />

      <div className={styles.overlayTop} />
      <div className={styles.overlayBottom} />

      <div className={styles.bubbleWrap} style={bubbleStyle}>
        <div className={styles.bubble}>
          <p className={styles.bubbleText}>{currentText.slice(0, visibleChars)}</p>
          <div
            className={classNames(styles.bubbleTail, {
              [styles.bubbleTailRight]: tailSide === "right",
              [styles.bubbleTailLeft]: tailSide === "left",
            })}
            style={tailStyle}
          />
        </div>
      </div>

      <div className={styles.bottomBar}>
        <div className={styles.dots}>
          {slides.map((_, idx) => (
            <span
              key={idx}
              className={classNames(styles.dot, {
                [styles.dotActive]: idx === currentSlide,
              })}
              style={
                idx === currentSlide
                  ? { background: accent, borderColor: accent }
                  : {}
              }
              onClick={() => setCurrentSlide(idx)}
            />
          ))}
        </div>

        <div className={styles.controls}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className={styles.checkbox}
            />
            <span>{t("game.roleTutorial.dontShowAgain")}</span>
          </label>

          <div className={styles.actions}>
            <Button
              variant={ButtonVariant.Tertiary}
              size={ButtonSize.MS}
              type={ButtonType.Button}
              onClick={handleSkip}
            >
              {t("game.roleTutorial.skip")}
            </Button>
            <Button
              variant={ButtonVariant.Outline}
              size={ButtonSize.MS}
              type={ButtonType.Button}
              onClick={handleNext}
            >
              {isLastSlide
                ? t("game.roleTutorial.done")
                : t("game.roleTutorial.next")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

RoleTutorialModal.displayName = "RoleTutorialModal";
