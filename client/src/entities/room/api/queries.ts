import { useQuery } from '@tanstack/react-query';
import { getRoom, listRooms } from './endpoints';
import type { RoomListQuery } from './types';
import { roomQueryKeys } from '../model/queryKeys';

export function useRoomDetailQuery(roomId: string) {
  return useQuery({ queryKey: roomQueryKeys.detail(roomId), queryFn: () => getRoom(roomId) });
}

export function useRoomsQuery(filters: RoomListQuery | undefined) {
  return useQuery({
    queryKey: roomQueryKeys.list(filters ?? {}),
    queryFn: async () => (await listRooms(filters as RoomListQuery)).items,
    enabled: Boolean(filters?.officeId && filters.from && filters.to),
  });
}
