import { useQuery } from '@tanstack/react-query';
import { api } from '../api/endpoints';
import { queryKeys } from '../lib/queryKeys';
import { getWorkdayInterval } from '../lib/time';

export function useRoomScheduleQuery(roomId: string, date: string, timezone: string) {
  const interval = getWorkdayInterval(date, timezone);
  return useQuery({
    queryKey: queryKeys.schedules.byRoom(roomId, date),
    queryFn: async () => (await api.getRoomSchedule(roomId, interval)).items,
  });
}
