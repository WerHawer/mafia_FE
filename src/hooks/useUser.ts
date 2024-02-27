import { useGetUsersQuery } from '../api/user/queries.ts';
import { IUser } from '../App.tsx';
import { useState } from 'react';

export const useUser = () => {
  const [user, setUser] = useState<IUser>();
  const { data: users } = useGetUsersQuery();

  return { user, users, setUser };
};
