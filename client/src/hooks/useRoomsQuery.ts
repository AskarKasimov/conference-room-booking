import { useQuery } from '@tanstack/react-query';
import type { RoomListQuery } from '../api/endpoints';
import { api } from '../api/endpoints';
import { queryKeys } from '../lib/queryKeys';

export function useRoomsQuery(filters: RoomListQuery | undefined) {
  return useQuery({
    queryKey: queryKeys.rooms.list(filters ?? {}),
    queryFn: async () => (await api.listRooms(filters as RoomListQuery)).items,
    enabled: Boolean(filters?.officeId && filters.from && filters.to),
  });
}
