import { useGetUsersQuery } from "../api/user/queries.ts";
import { useState } from "react";
import { IUser } from "../types/user";

export const useUser = () => {
  const [user, setUser] = useState<IUser | null>(null);
  const { data: users } = useGetUsersQuery();

  return { user, users, setUser };
};
