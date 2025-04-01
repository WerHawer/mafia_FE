import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { LoginFormInputs } from "@/components/LoginForm/LoginForm.tsx";
import { SingUpFormInputs } from "@/components/SingUpForm/SingUpForm.tsx";

import { queryKeys } from "../apiConstants.ts";
import { auth, userLogin, userSignUp } from "./api.ts";

export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (loginData: LoginFormInputs) => userLogin(loginData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.auth] });
    },
  });
};

export const useSignUpMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (signUpData: Omit<SingUpFormInputs, "passwordRepeat">) =>
      userSignUp(signUpData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.auth] });
    },
  });
};

export const useAuthQuery = (token?: string) => {
  return useQuery({
    queryKey: [queryKeys.auth, token],
    queryFn: () => auth(token),
    select: ({ data }) => data,
    retry: false,
    enabled: !!token,
  });
};
