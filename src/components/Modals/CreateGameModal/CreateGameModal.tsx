import classNames from "classnames";
import { AnimatePresence, motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useCreateGameMutation } from "@/api/game/queries.ts";
import { createGameObj } from "@/helpers/createGameObj.ts";
import { routes } from "@/router/routs.ts";
import { modalStore } from "@/store/modalStore.ts";
import { usersStore } from "@/store/usersStore.ts";
import { GameType } from "@/types/game.types.ts";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonType, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import { Input } from "@/UI/Input";
import { Switcher } from "@/UI/Switcher";

import {
    ADDITIONAL_ROLES_OPTIONS,
    DEFAULT_VALUES,
    FormValues,
    MAX_PLAYERS_OPTIONS
} from "./CreateGameModal.config.ts";
import styles from "./CreateGameModal.module.scss";

export const CreateGameModal = observer(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate: createGame, isPending } = useCreateGameMutation();
  const { myId } = usersStore;
  const { closeModal } = modalStore;

  const { control, handleSubmit, watch, register, setValue } =
    useForm<FormValues>({
      defaultValues: DEFAULT_VALUES,
    });

  const isPrivate = watch("isPrivate");
  const maxPlayers = watch("maxPlayers");

  // Auto-calculate mafia count based on player count
  // 5-6 players -> 1 mafia
  // 7 players -> 2 mafia
  // 8+ players -> 3 mafia
  useEffect(() => {
    let count = 1;
    const players = Number(maxPlayers);

    if (players >= 8) {
      count = 3;
    } else if (players === 7) {
      count = 2;
    } else {
      count = 1;
    }

    setValue("mafiaCount", count);
  }, [maxPlayers, setValue]);

  const onSubmit = useCallback(
    (data: FormValues) => {
      if (!myId) return;

      const game = createGameObj({
        owner: myId,
        gameType: GameType.Standard,
        maxPlayers: Number(data.maxPlayers),
        mafiaCount: Number(data.mafiaCount),
        additionalRoles: data.additionalRoles,
        password: data.isPrivate ? data.password : undefined,
      });

      createGame(game, {
        onSuccess: ({ data }) => {
          closeModal();
          navigate(`${routes.game}/${data.id}`);
        },
      });
    },
    [createGame, myId, navigate, closeModal]
  );

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{t("createGame")}</h2>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.row}>
          <label className={styles.label}>{t("maxPlayers")}</label>
          <select
            {...register("maxPlayers", { valueAsNumber: true })}
            className={styles.select}
          >
            {MAX_PLAYERS_OPTIONS.map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.row}>
          <label className={styles.label}>{t("mafiaCount")}</label>
          <div className={styles.readOnlyField}>{watch("mafiaCount")}</div>
          {/* Hidden input to ensure value is registered */}
          <input
            type="hidden"
            {...register("mafiaCount", { valueAsNumber: true })}
          />
        </div>

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
                        className={classNames(styles.roleCheckbox, {
                          [styles.active]: isSelected,
                        })}
                        onClick={() => {
                          if (isSelected) {
                            field.onChange(
                              field.value.filter((v) => v !== role.value)
                            );
                          } else {
                            field.onChange([...field.value, role.value]);
                          }
                        }}
                      >
                        {/* TODO: Add icons if available */}
                        {t(`roles.${role.value}`, role.label)}
                      </div>
                    );
                  })}
                </>
              )}
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.checkboxContainer}>
            <label className={styles.label}>{t("privateGame")}</label>
            <Controller
              name="isPrivate"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Switcher checked={value} onChange={() => onChange(!value)} />
              )}
            />
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
            {t("create")}
          </Button>
        </div>
      </form>
    </div>
  );
});
