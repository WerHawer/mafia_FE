import { observer } from "mobx-react-lite";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { verifyGamePassword } from "@/api/game/api.ts";
import { modalStore } from "@/store/modalStore.ts";
import { Button } from "@/UI/Button";
import {
    ButtonSize,
    ButtonType,
    ButtonVariant,
} from "@/UI/Button/ButtonTypes.ts";
import { Input } from "@/UI/Input";

import styles from "./EnterPasswordModal.module.scss";

type FormValues = {
  password: string;
};

export const EnterPasswordModal = observer(() => {
  const { t } = useTranslation();
  const { closeModal, modalData } = modalStore;
  const { gameId, onSuccess } = modalData as {
    gameId: string;
    onSuccess: () => void;
  };

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      password: "",
    },
  });

  const onSubmit = useCallback(
    async (data: FormValues) => {
      setError(null);
      setIsLoading(true);

      try {
        await verifyGamePassword({ gameId, password: data.password });
        // Password is correct
        closeModal();
        onSuccess();
      } catch (err: any) {
        // Password is incorrect or other error
        setError(t("incorrectPassword"));
      } finally {
        setIsLoading(false);
      }
    },
    [gameId, onSuccess, closeModal, t]
  );

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{t("enterGamePassword")}</h2>
      <p className={styles.description}>{t("privateGameDescription")}</p>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              placeholder={t("password")}
              type="password"
              autoComplete="off"
              autoFocus
            />
          )}
        />

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.footer}>
          <Button
            variant={ButtonVariant.Secondary}
            onClick={closeModal}
            size={ButtonSize.Medium}
            type={ButtonType.Button}
            disabled={isLoading}
          >
            {t("cancel")}
          </Button>
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Medium}
            type={ButtonType.Submit}
            disabled={isLoading}
          >
            {isLoading ? t("verifying") : t("confirm")}
          </Button>
        </div>
      </form>
    </div>
  );
});
