import { useQuery } from '@tanstack/react-query';
import { api } from '../api/endpoints';
import { queryKeys } from '../lib/queryKeys';

export function useRoomDetailQuery(roomId: string) {
  return useQuery({ queryKey: queryKeys.rooms.detail(roomId), queryFn: () => api.getRoom(roomId) });
}
