import { AnimatePresence, motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { usePatchGameMutation, useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import { ADDITIONAL_ROLES_OPTIONS } from "@/components/Modals/CreateGameModal/CreateGameModal.config.ts";
import { modalStore } from "@/store/modalStore.ts";
import { gamesStore } from "@/store/gamesStore.ts";
import { Roles } from "@/types/game.types.ts";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonType, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import { Input } from "@/UI/Input";
import { Switcher } from "@/UI/Switcher";

import styles from "../CreateGameModal/CreateGameModal.module.scss";
import classNames from "classnames";

type SettingsValues = {
  additionalRoles: Roles[];
  isPrivate: boolean;
  password?: string;
  speakTime: number;
  votesTime: number;
  candidateSpeakTime: number;
};

export const GameSettingsModal = observer(() => {
  const { t } = useTranslation();
  const { closeModal } = modalStore;
  const { gameFlow, activeGame, activeGameId } = gamesStore;
  const { mutate: patchGame, isPending: isPatchPending } = usePatchGameMutation();
  const { mutate: updateGameFlow, isPending: isFlowPending } = useUpdateGameFlowMutation();
  const isPending = isPatchPending || isFlowPending;

  const { control, handleSubmit, watch } = useForm<SettingsValues>({
    defaultValues: {
      additionalRoles: activeGame?.additionalRoles ?? [],
      isPrivate: activeGame?.isPrivate ?? false,
      password: "",
      speakTime: gameFlow.speakTime ?? 60,
      votesTime: gameFlow.votesTime ?? 15,
      candidateSpeakTime: gameFlow.candidateSpeakTime ?? 30,
    },
  });

  const isPrivate = watch("isPrivate");

  const onSubmit = useCallback(
    (data: SettingsValues) => {
      if (!activeGameId) return;

      // Update game fields (additionalRoles, privacy)
      patchGame({
        gameId: activeGameId,
        data: {
          additionalRoles: data.additionalRoles,
          isPrivate: data.isPrivate,
          password: data.isPrivate ? data.password || activeGame?.password : undefined,
        },
      });

      // Update gameFlow timings
      updateGameFlow(
        {
          speakTime: data.speakTime,
          votesTime: data.votesTime,
          candidateSpeakTime: data.candidateSpeakTime,
        },
        { onSuccess: closeModal }
      );
    },
    [patchGame, updateGameFlow, activeGameId, activeGame?.password, closeModal]
  );

  const TimingControl = ({
    field,
    min,
    max,
  }: {
    field: { value: number; onChange: (v: number) => void };
    min: number;
    max: number;
  }) => (
    <div className={styles.timingControl}>
      <button type="button" className={styles.timingBtn} onClick={() => field.onChange(Math.max(min, field.value - 5))}>−</button>
      <span className={styles.timingValue}>{field.value}</span>
      <button type="button" className={styles.timingBtn} onClick={() => field.onChange(Math.min(max, field.value + 5))}>+</button>
    </div>
  );

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{t("game.settings", "Налаштування гри")}</h2>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        {/* Additional roles */}
        <div className={styles.row}>
          <label className={styles.label}>{t("additionalRoles")}</label>
          <div className={styles.rolesContainer}>
            <Controller
              name="additionalRoles"
              control={control}
              render={({ field }) => (
                <>
                  {ADDITIONAL_ROLES_OPTIONS.map((role) => {
                    const isSelected = field.value.includes(role.value);
                    return (
                      <div
                        key={role.value}
                        className={classNames(styles.roleCheckbox, { [styles.active]: isSelected })}
                        onClick={() => {
                          field.onChange(
                            isSelected
                              ? field.value.filter((v) => v !== role.value)
                              : [...field.value, role.value]
                          );
                        }}
                      >
                        {t(`roles.${role.value}`, role.label)}
                      </div>
                    );
                  })}
                </>
              )}
            />
          </div>
        </div>

        {/* Private game toggle */}
        <div className={styles.row}>
          <div className={styles.checkboxContainer}>
            <Controller
              name="isPrivate"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Switcher checked={value} onChange={() => onChange(!value)} />
              )}
            />
            <label className={styles.label}>{t("privateGame")}</label>
          </div>
        </div>

        <AnimatePresence>
          {isPrivate && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={styles.row}
            >
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder={t("enterPassword")}
                    autoComplete="off"
                  />
                )}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Time settings */}
        <div className={styles.row}>
          <label className={styles.label}>{t("game.timings")}</label>
          <div className={styles.timingsGrid}>
            <Controller
              name="speakTime"
              control={control}
              render={({ field }) => (
                <div className={styles.timingItem}>
                  <span className={styles.timingLabel}>{t("game.speakTime")}</span>
                  <TimingControl field={field} min={10} max={300} />
                </div>
              )}
            />
            <Controller
              name="votesTime"
              control={control}
              render={({ field }) => (
                <div className={styles.timingItem}>
                  <span className={styles.timingLabel}>{t("game.votesTime")}</span>
                  <TimingControl field={field} min={5} max={120} />
                </div>
              )}
            />
            <Controller
              name="candidateSpeakTime"
              control={control}
              render={({ field }) => (
                <div className={styles.timingItem}>
                  <span className={styles.timingLabel}>{t("game.candidateSpeakTime")}</span>
                  <TimingControl field={field} min={5} max={120} />
                </div>
              )}
            />
          </div>
        </div>

        <div className={styles.footer}>
          <Button
            variant={ButtonVariant.Secondary}
            onClick={closeModal}
            size={ButtonSize.Medium}
            disabled={isPending}
            type={ButtonType.Button}
          >
            {t("cancel")}
          </Button>
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Medium}
            type={ButtonType.Submit}
            disabled={isPending}
          >
            {t("common.done")}
          </Button>
        </div>
      </form>
    </div>
  );
});

GameSettingsModal.displayName = "GameSettingsModal";
