import { useQuery } from '@tanstack/react-query';
import { api } from '../api/endpoints';
import { queryKeys } from '../lib/queryKeys';

export function useOfficesQuery() {
  return useQuery({
    queryKey: queryKeys.offices.all,
    queryFn: async () => (await api.listOffices()).items,
  });
}
