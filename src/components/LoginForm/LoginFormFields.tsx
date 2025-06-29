import { useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { LoginFormInputs } from "@/components/LoginForm/config.ts";
import { addErrorFromBEToForm } from "@/helpers/addErrorFromBEToForm.ts";
import { Button } from "@/UI/Button";
import { ButtonType, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import { FormError } from "@/UI/FormError";
import { Input } from "@/UI/Input";
import { InputPassword } from "@/UI/Input/InputPassword";

type LoginFormFieldsProps = {
  isPending?: boolean;
  error?: unknown;
};

export const LoginFormFields = ({
  isPending = false,
  error,
}: LoginFormFieldsProps) => {
  const {
    control,
    formState: { errors },
    setError,
  } = useFormContext<LoginFormInputs>();
  const { t } = useTranslation();

  useEffect(() => {
    if (!error) return;

    addErrorFromBEToForm<LoginFormInputs>(error, setError);
  }, [error, setError]);

  return (
    <>
      <Controller
        control={control}
        name="login"
        render={({ field, fieldState }) => (
          <Input
            placeholder={t("auth.nickname")}
            {...field}
            autoFocus
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <>
            <InputPassword
              placeholder={t("auth.password")}
              {...field}
              error={fieldState.error?.message}
            />
          </>
        )}
      />

      {errors.root && <FormError error={errors.root.message} />}

      <Button
        type={ButtonType.Submit}
        variant={ButtonVariant.Primary}
        disabled={isPending}
        width="fullWidth"
      >
        {t("auth.login")}
      </Button>
    </>
  );
};
