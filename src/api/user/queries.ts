import { useQueries, useQuery } from "@tanstack/react-query";
import { FIVE_MINUTES, ONE_DAY, queryKeys } from "../apiConstants.ts";
import { getUserById, getUsers } from "./api.ts";
import { getQueriesStatus } from "../../helpers/getQueriesStatus.ts";
import { getDataFromQueries } from "../../helpers/getDataFromQueries.ts";
import { usersStore } from "../../store/usersStore.ts";
import { IUser } from "../../types/user.types.ts";

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

export const useGetUsersByIds = (ids: string[]) => {
  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: [queryKeys.user, id],
      queryFn: () => getUserById(id),
      staleTime: ONE_DAY,
    })),
  });

  const queryStatus = getQueriesStatus(queries);
  const data = getDataFromQueries(queries);

  return { data, ...queryStatus };
};

export const useGetUsersWithAddToStore = (ids: string[]) => {
  const users = useGetUsersByIds(ids);
  const { setUser, allUsers } = usersStore;

  users.data.forEach((user: IUser) => {
    if (!allUsers[user.id]) {
      setUser(user);
    }
  });

  return users;
};
