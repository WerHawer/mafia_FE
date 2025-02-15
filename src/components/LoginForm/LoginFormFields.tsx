import { useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@/UI/Input";
import { InputPassword } from "@/UI/Input/InputPassword";
import { Button } from "@/UI/Button";
import { ButtonType, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import { FormError } from "@/UI/FormError";
import { addErrorFromBEToForm } from "@/helpers/addErrorFromBEToForm.ts";
import { LoginFormInputs } from "@/components/LoginForm/LoginForm.tsx";

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
            placeholder="Login"
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
              placeholder="Password"
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
        Login
      </Button>
    </>
  );
};
