import { useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { LoginFormInputs } from "@/components/LoginForm/config.ts";
import { addErrorFromBEToForm } from "@/helpers/addErrorFromBEToForm.ts";
import { Button } from "@/UI/Button";
import { ButtonType } from "@/UI/Button/ButtonTypes.ts";
import { FormError } from "@/UI/FormError";
import { Input } from "@/UI/Input";
import { InputPassword } from "@/UI/Input/InputPassword";

type SignUpFormFieldsProps = {
  isPending?: boolean;
  error?: unknown;
};

export const SignUpFormFields = ({
  error,
  isPending = false,
}: SignUpFormFieldsProps) => {
  const {
    control,
    formState: { errors },
    setError,
  } = useFormContext();
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
          <>
            <Input
              placeholder={t("auth.nickname")}
              autoFocus
              {...field}
              error={fieldState.error?.message}
            />
          </>
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <>
            <InputPassword
              placeholder={t("auth.password")}
              autoComplete="password"
              error={fieldState.error?.message}
              {...field}
            />
          </>
        )}
      />

      <Controller
        control={control}
        name="passwordRepeat"
        render={({ field, fieldState }) => (
          <>
            <InputPassword
              placeholder={t("auth.repeatPassword")}
              autoComplete="new-password"
              error={fieldState.error?.message}
              {...field}
            />
          </>
        )}
      />

      {errors.root && <FormError error={errors.root.message} />}

      <Button type={ButtonType.Submit} disabled={isPending} width="fullWidth">
        {t("auth.signUp")}
      </Button>
    </>
  );
};
