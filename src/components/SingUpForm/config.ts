import * as yup from "yup";

export const MIN_PASSWORD_LENGTH = 8;
export const MIN_nikName_LENGTH = 3;

export type SingUpFormInputs = {
  login: string;
  password: string;
  passwordRepeat: string;
};

export const schema = yup
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

export const defaultValues: SingUpFormInputs = {
  login: "",
  password: "",
  passwordRepeat: "",
};
