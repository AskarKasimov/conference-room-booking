import { useQuery } from '@tanstack/react-query';
import { listOffices } from './endpoints';
import { officeQueryKeys } from '../model/queryKeys';

export function useOfficesQuery() {
  return useQuery({
    queryKey: officeQueryKeys.all,
    queryFn: async () => (await listOffices()).items,
  });
}
