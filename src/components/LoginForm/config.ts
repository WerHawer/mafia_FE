import * as yup from "yup";

const MIN_PASSWORD_LENGTH = 8;
const MIN_LOGIN_LENGTH = 3;

export type LoginFormInputs = {
  login: string;
  password: string;
};

export const schema = yup
  .object({
    login: yup.string().required().min(MIN_LOGIN_LENGTH),
    password: yup.string().required().min(MIN_PASSWORD_LENGTH),
  })
  .required();

export const defaultValues: LoginFormInputs = {
  login: "",
  password: "",
};
