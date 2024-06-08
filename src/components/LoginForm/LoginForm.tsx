import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import styles from "./LoginForm.module.scss";
import { routes } from "@/router/routs.ts";
import { useLoginMutation } from "@/api/auth/queries.ts";
import { addTokenToAxios } from "@/helpers/addTokenToAxios.ts";
import { usersStore } from "@/store/usersStore.ts";
import { observer } from "mobx-react-lite";
import { useSocket } from "@/hooks/useSocket.ts";
import { Form } from "@/components/Form/Form.tsx";
import { LoginFormFields } from "@/components/LoginForm/LoginFormFields.tsx";
import { Typography } from "@/UI/Typography/Typography.tsx";
import { Link } from "@/components/Link";
import { SubmitHandler } from "react-hook-form";

const MIN_PASSWORD_LENGTH = 8;
const MIN_LOGIN_LENGTH = 3;

export type LoginFormInputs = {
  login: string;
  password: string;
};

const schema = yup
  .object({
    login: yup.string().required().min(MIN_LOGIN_LENGTH),
    password: yup.string().required().min(MIN_PASSWORD_LENGTH),
  })
  .required();

const defaultValues: LoginFormInputs = {
  login: "",
  password: "",
};

export const LoginForm = observer(() => {
  const { isPending, mutate, error } = useLoginMutation();
  const { isConnected, connect, socket } = useSocket();
  const { setToken, setMyUser } = usersStore;

  const navigate = useNavigate();

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
    });
  };

  return (
    <Form<LoginFormInputs>
      onSubmit={onSubmit}
      className={styles.form}
      validation={schema}
      defaultValues={defaultValues}
    >
      <Typography variant="title">Login</Typography>

      <Typography variant="subtitle">
        Please enter your login and password:
      </Typography>

      <LoginFormFields isPending={isPending} error={error} />

      <div className={styles.formFooter}>
        <Typography variant="subtitle">New player?</Typography>
        <Link to={routes.singUp}>Create an account</Link>
      </div>
    </Form>
  );
});

LoginForm.displayName = "LoginForm";
