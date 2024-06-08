import * as yup from "yup";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { routes } from "@/router/routs.ts";
import { useSignUpMutation } from "@/api/auth/queries.ts";
import { addTokenToAxios } from "@/helpers/addTokenToAxios.ts";
import { usersStore } from "@/store/usersStore.ts";
import { observer } from "mobx-react-lite";
import { useSocket } from "@/hooks/useSocket.ts";
import styles from "./SingUpForm.module.scss";
import { SignUpFormFields } from "@/components/SingUpForm/SignUpFormFields.tsx";
import { Form } from "@/components/Form";
import { Typography } from "@/UI/Typography";
import { Link } from "@/components/Link";

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

const defaultValues: SingUpFormInputs = {
  nickName: "",
  password: "",
  passwordRepeat: "",
};

export const SingUpForm = observer(() => {
  const { isPending, mutate, error } = useSignUpMutation();
  const { isConnected, connect, socket } = useSocket();
  const { setToken, setMyUser } = usersStore;

  const navigate = useNavigate();

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
      },
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
