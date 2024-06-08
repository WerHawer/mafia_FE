import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@/UI/Input";
import { InputPassword } from "@/UI/Input/InputPassword";
import { FormError } from "@/UI/FormError";
import { Button } from "@/UI/Button";
import { ButtonType } from "@/UI/Button/ButtonTypes.ts";
import { useEffect } from "react";
import { addErrorFromBEToForm } from "@/helpers/addErrorFromBEToForm.ts";
import { LoginFormInputs } from "@/components/LoginForm/LoginForm.tsx";

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

  useEffect(() => {
    if (!error) return;

    addErrorFromBEToForm<LoginFormInputs>(error, setError);
  }, [error, setError]);

  return (
    <>
      <Controller
        control={control}
        name="nickName"
        render={({ field, fieldState }) => (
          <>
            <Input
              placeholder="Login"
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
              placeholder="Password"
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
              placeholder="Repeat your password"
              autoComplete="new-password"
              error={fieldState.error?.message}
              {...field}
            />
          </>
        )}
      />

      {errors.root && <FormError error={errors.root.message} />}

      <Button type={ButtonType.Submit} disabled={isPending} width="fullWidth">
        Sing Up
      </Button>
    </>
  );
};
