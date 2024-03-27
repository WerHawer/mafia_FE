import { useQuery } from "@tanstack/react-query";
import { FIVE_MINUTES, ONE_DAY, queryKeys } from "../apiConstants.ts";
import { getUserById, getUsers } from "./api.ts";

export const useGetUsersQuery = () => {
  return useQuery({
    queryKey: [queryKeys.users],
    queryFn: getUsers,
    staleTime: FIVE_MINUTES,
    select: (data) => data.data,
  });
};

export const useGetUserByIdQuery = (id: string) => {
  return useQuery({
    queryKey: [queryKeys.user, id],
    queryFn: () => getUserById(id),
    staleTime: ONE_DAY,
    select: ({ data }) => data,
  });
};
