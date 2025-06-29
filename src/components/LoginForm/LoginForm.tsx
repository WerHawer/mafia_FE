import { observer } from "mobx-react-lite";
import { SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useLoginMutation } from "@/api/auth/queries.ts";
import { Form } from "@/components/Form/Form.tsx";
import { Link } from "@/components/Link";
import {
  defaultValues,
  LoginFormInputs,
  schema,
} from "@/components/LoginForm/config.ts";
import { LoginFormFields } from "@/components/LoginForm/LoginFormFields.tsx";
import { addTokenToAxios } from "@/helpers/addTokenToAxios.ts";
import { useSocket } from "@/hooks/useSocket.ts";
import { routes } from "@/router/routs.ts";
import { usersStore } from "@/store/usersStore.ts";
import { Typography } from "@/UI/Typography/Typography.tsx";

import styles from "./LoginForm.module.scss";

export const LoginForm = observer(() => {
  const { isPending, mutate, error } = useLoginMutation();
  const { isConnected, connect, socket } = useSocket();
  const { setToken, setMyUser } = usersStore;
  const { t } = useTranslation();

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
      <Typography variant="title">{t("auth.login")}</Typography>

      <Typography variant="subtitle">{t("auth.enterCredentials")}</Typography>

      <LoginFormFields isPending={isPending} error={error} />

      <div className={styles.formFooter}>
        <Typography variant="subtitle">{t("auth.newPlayer")}</Typography>
        <Link to={routes.singUp}>{t("auth.createAccount")}</Link>
      </div>
    </Form>
  );
});

LoginForm.displayName = "LoginForm";
