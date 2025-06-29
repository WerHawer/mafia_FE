import { observer } from "mobx-react-lite";
import { SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useSignUpMutation } from "@/api/auth/queries.ts";
import { Form } from "@/components/Form";
import { Link } from "@/components/Link";
import {
  defaultValues,
  schema,
  SingUpFormInputs,
} from "@/components/SingUpForm/config.ts";
import { SignUpFormFields } from "@/components/SingUpForm/SignUpFormFields.tsx";
import { addTokenToAxios } from "@/helpers/addTokenToAxios.ts";
import { useSocket } from "@/hooks/useSocket.ts";
import { routes } from "@/router/routs.ts";
import { usersStore } from "@/store/usersStore.ts";
import { Typography } from "@/UI/Typography";

import styles from "./SingUpForm.module.scss";

export const SingUpForm = observer(() => {
  const { isPending, mutate, error } = useSignUpMutation();
  const { isConnected, connect, socket } = useSocket();
  const { setToken, setMyUser } = usersStore;
  const { t } = useTranslation();

  const navigate = useNavigate();

  const onSubmit: SubmitHandler<SingUpFormInputs> = ({ login, password }) => {
    mutate(
      { login, password },
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
      }
    );
  };

  return (
    <Form<SingUpFormInputs>
      onSubmit={onSubmit}
      validation={schema}
      className={styles.form}
      defaultValues={defaultValues}
    >
      <Typography variant="title">{t("auth.signUp")}</Typography>

      <Typography variant="subtitle">{t("auth.fillFields")}</Typography>

      <SignUpFormFields error={error} isPending={isPending} />

      <div className={styles.formFooter}>
        <Typography variant="subtitle">{t("auth.existingAccount")}</Typography>
        <Link to={routes.login}>{t("auth.login")}</Link>
      </div>
    </Form>
  );
});
