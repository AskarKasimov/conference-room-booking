import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from './endpoints';
import { userQueryKeys } from '../model/queryKeys';

export function useCurrentUserQuery() {
  return useQuery({ queryKey: userQueryKeys.current, queryFn: getCurrentUser });
}
