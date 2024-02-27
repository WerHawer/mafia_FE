import { useQuery } from '@tanstack/react-query'
import { FIVE_MINUTES, queryKeys } from '../apiConstants.ts'
import { getUsers } from './api.ts'

export const useGetUsersQuery = () => {
  return useQuery({
    queryKey: [queryKeys.users],
    queryFn: getUsers,
    staleTime: FIVE_MINUTES,
    select: (data) => data.data,
  })
}
