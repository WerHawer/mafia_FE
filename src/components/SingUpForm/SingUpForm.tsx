import * as yup from "yup";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import { Input } from "@/UI/Input";
import { Button } from "@/UI/Button";
import { ButtonType, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import { routes } from "@/router/routs.ts";
import { InputError } from "@/UI/InputError";
import { addErrorFromBEToForm } from "@/helpers/addErrorFromBEToForm.ts";
import { useSignUpMutation } from "@/api/auth/queries.ts";
import { addTokenToAxios } from "@/helpers/addTokenToAxios.ts";
import { InputPassword } from "@/UI/Input/InputPassword";
import { usersStore } from "@/store/usersStore.ts";
import { observer } from "mobx-react-lite";
import { useSocket } from "@/hooks/useSocket.ts";
import styles from "./SingUpForm.module.scss";

const MIN_PASSWORD_LENGTH = 8;
const MIN_NICKNAME_LENGTH = 3;

export type SingUpFormInputs = {
  nickName: string;
  password: string;
  passwordRepeat: string;
};

const schema = yup
  .object({
    nickName: yup.string().required().min(MIN_NICKNAME_LENGTH),
    password: yup.string().required().min(MIN_PASSWORD_LENGTH),
    passwordRepeat: yup
      .string()
      .required()
      .min(MIN_PASSWORD_LENGTH)
      .oneOf([yup.ref("password")], "Passwords must match"),
  })
  .required();

export const SingUpForm = observer(() => {
  const { isPending, mutate } = useSignUpMutation();
  const { isConnected, connect, socket } = useSocket();
  const { setToken, setMyUser } = usersStore;

  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SingUpFormInputs>({
    defaultValues: {
      nickName: "",
      password: "",
    },
    resolver: yupResolver(schema),
  });

  const onSubmit: SubmitHandler<SingUpFormInputs> = ({
    nickName,
    password,
  }) => {
    mutate(
      { nickName, password },
      {
        onSuccess: (res) => {
          const { token } = res.data;
          addTokenToAxios(token);
          setToken(token);
          setMyUser(res.data.user);

          if (socket && !isConnected) {
            connect();
          }

          navigate(routes.home);
        },
        onError: (error) => {
          addErrorFromBEToForm<SingUpFormInputs>(error, setError);
        },
      },
    );
  };

  return (
    <div className={styles.container}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={styles.form}
        autoComplete="off"
      >
        <h2>Sing Up</h2>
        <Controller
          control={control}
          name="nickName"
          render={({ field, fieldState }) => (
            <>
              <Input placeholder="Login" autoComplete="off" {...field} />
              {fieldState.error && (
                <InputError message={fieldState.error.message} />
              )}
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
                {...field}
              />
              {fieldState.error && (
                <InputError message={fieldState.error.message} />
              )}
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
                {...field}
              />
              {fieldState.error && (
                <InputError message={fieldState.error.message} />
              )}
            </>
          )}
        />

        {errors.root && <InputError message={errors.root.message} />}

        <p className={styles.singUpLink}>
          already have account? Go to <Link to={routes.login}>Login</Link>
        </p>

        <Button
          type={ButtonType.Submit}
          variant={ButtonVariant.Secondary}
          disabled={isPending}
        >
          Sing Up
        </Button>
      </form>
    </div>
  );
});
