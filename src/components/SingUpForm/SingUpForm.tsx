import { observer } from "mobx-react-lite";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";

import { useSignUpMutation } from "@/api/auth/queries.ts";
import { Form } from "@/components/Form";
import { Link } from "@/components/Link";
import { SignUpFormFields } from "@/components/SingUpForm/SignUpFormFields.tsx";
import { addTokenToAxios } from "@/helpers/addTokenToAxios.ts";
import { useSocket } from "@/hooks/useSocket.ts";
import { routes } from "@/router/routs.ts";
import { usersStore } from "@/store/usersStore.ts";
import { Typography } from "@/UI/Typography";

import styles from "./SingUpForm.module.scss";

const MIN_PASSWORD_LENGTH = 8;
const MIN_nikName_LENGTH = 3;

export type SingUpFormInputs = {
  login: string;
  password: string;
  passwordRepeat: string;
};

const schema = yup
  .object({
    login: yup.string().required().min(MIN_nikName_LENGTH),
    password: yup.string().required().min(MIN_PASSWORD_LENGTH),
    passwordRepeat: yup
      .string()
      .required()
      .min(MIN_PASSWORD_LENGTH)
      .oneOf([yup.ref("password")], "Passwords must match"),
  })
  .required();

const defaultValues: SingUpFormInputs = {
  login: "",
  password: "",
  passwordRepeat: "",
};

export const SingUpForm = observer(() => {
  const { isPending, mutate, error } = useSignUpMutation();
  const { isConnected, connect, socket } = useSocket();
  const { setToken, setMyUser } = usersStore;

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
      <Typography variant="title">Register</Typography>

      <Typography variant="subtitle">
        Please fill in the fields below:
      </Typography>

      <SignUpFormFields error={error} isPending={isPending} />

      <div className={styles.formFooter}>
        <Typography variant="subtitle">Already have an account?</Typography>
        <Link to={routes.login}>Login</Link>
      </div>
    </Form>
  );
});
