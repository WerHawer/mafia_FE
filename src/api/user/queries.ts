import { useQuery } from "@tanstack/react-query";
import { FIVE_MINUTES, ONE_DAY, queryKeys } from "../apiConstants.ts";
import { getUserById, getUsers, getUsersByIds } from "./api.ts";
import { usersStore } from "../../store/usersStore.ts";

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

export const useGetUsersByIds = (ids: string[], enabled = true) => {
  return useQuery({
    queryKey: [queryKeys.users, ids],
    queryFn: () => getUsersByIds(ids),
    staleTime: ONE_DAY,
    select: ({ data }) => data,
    enabled,
  });
};

export const useGetUsersWithAddToStore = (ids: string[], enabled = true) => {
  const users = useGetUsersByIds(ids, enabled);
  const { setUsers } = usersStore;

  if (users.data) {
    setUsers(users.data);
  }

  return users;
};
