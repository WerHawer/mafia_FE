import * as yup from "yup";
import { SubmitHandler, Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import { Input } from "../../UI/Input";
import styles from "./LoginForm.module.scss";
import { Button } from "../../UI/Button";
import { ButtonType, ButtonVariant } from "../../UI/Button/ButtonTypes.ts";
import { routes } from "../../router/routs.ts";
import { InputError } from "../../UI/InputError";
import { addErrorFromBEToForm } from "../../helpers/addErrorFromBEToForm.ts";
import { useLoginMutation } from "../../api/auth/queries.ts";
import { addTokenToAxios } from "../../helpers/addTokenToAxios.ts";
import { InputPassword } from "../../UI/Input/InputPassword";
import { userStore } from "../../store/mobx/userStore.ts";
import { observer } from "mobx-react-lite";
import { useSocket } from "../../context/SocketProvider.tsx";

const MIN_PASSWORD_LENGTH = 8;
type LoginFormInputs = {
  email: string;
  password: string;
};

const schema = yup
  .object({
    email: yup.string().required().email(),
    password: yup.string().required().min(MIN_PASSWORD_LENGTH),
  })
  .required();

export const LoginForm = observer(() => {
  const { mutate } = useLoginMutation();
  const { isConnected, connect, socket } = useSocket();
  const { setToken, setMyUser } = userStore;

  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    defaultValues: {
      email: "",
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
        addErrorFromBEToForm(error, setError);
      },
    });
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <h2>Login</h2>
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <>
              <Input placeholder="e-mail" {...field} />
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

        <Button type={ButtonType.Submit} variant={ButtonVariant.Secondary}>
          Login
        </Button>
      </form>
    </div>
  );
});
