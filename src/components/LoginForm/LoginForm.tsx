import * as yup from "yup";
import { SubmitHandler, Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import { Input } from "@/UI/Input";
import styles from "./LoginForm.module.scss";
import { Button } from "@/UI/Button";
import { ButtonType, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import { routes } from "@/router/routs.ts";
import { InputError } from "@/UI/InputError";
import { addErrorFromBEToForm } from "@/helpers/addErrorFromBEToForm.ts";
import { useLoginMutation } from "@/api/auth/queries.ts";
import { addTokenToAxios } from "@/helpers/addTokenToAxios.ts";
import { InputPassword } from "@/UI/Input/InputPassword";
import { usersStore } from "@/store/usersStore.ts";
import { observer } from "mobx-react-lite";
import { useSocket } from "@/hooks/useSocket.ts";

const MIN_PASSWORD_LENGTH = 8;
export type LoginFormInputs = {
  login: string;
  password: string;
};

const schema = yup
  .object({
    login: yup.string().required().min(3),
    password: yup.string().required().min(MIN_PASSWORD_LENGTH),
  })
  .required();

export const LoginForm = observer(() => {
  const { isPending, mutate } = useLoginMutation();
  const { isConnected, connect, socket } = useSocket();
  const { setToken, setMyUser } = usersStore;

  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    defaultValues: {
      login: "",
      password: "",
    },
    resolver: yupResolver(schema),
  });

  const onSubmit: SubmitHandler<LoginFormInputs> = (data) => {
    mutate(data, {
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
        addErrorFromBEToForm<LoginFormInputs>(error, setError);
      },
    });
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <h2>Login</h2>
        <Controller
          control={control}
          name="login"
          render={({ field, fieldState }) => (
            <>
              <Input placeholder="Login" {...field} />
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
              <InputPassword placeholder="password" {...field} />
              {fieldState.error && (
                <InputError message={fieldState.error.message} />
              )}
            </>
          )}
        />

        {errors.root && <InputError message={errors.root.message} />}

        <p className={styles.singUpLink}>
          don`t have account go to <Link to={routes.singUp}>Sing up</Link>
        </p>

        <Button
          type={ButtonType.Submit}
          variant={ButtonVariant.Secondary}
          disabled={isPending}
        >
          Login
        </Button>
      </form>
    </div>
  );
});
