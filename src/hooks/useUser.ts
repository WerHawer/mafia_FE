import { useGetUsersQuery } from '../api/user/queries.ts';
import { IUser } from '../App.tsx';
import { useState } from 'react';

export const useUser = () => {
  const [user, setUser] = useState<IUser | null>(null);
  const { data: users } = useGetUsersQuery();

  return { user, users, setUser };
};
