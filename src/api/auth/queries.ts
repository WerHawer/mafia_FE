import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { auth, userLogin } from "./api.ts";
import { queryKeys } from "../apiConstants.ts";

export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (loginData: { email: string; password: string }) =>
      userLogin(loginData),
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
