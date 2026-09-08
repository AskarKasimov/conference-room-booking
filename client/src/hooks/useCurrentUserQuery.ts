import { useQuery } from '@tanstack/react-query';
import { api } from '../api/endpoints';
import { queryKeys } from '../lib/queryKeys';

export function useCurrentUserQuery() {
  return useQuery({ queryKey: queryKeys.user.current, queryFn: api.getCurrentUser });
}
