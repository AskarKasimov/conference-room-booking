import type { QueryClient } from '@tanstack/react-query';
import { officeQueryKeys } from '../../entities/office';
import { roomQueryKeys } from '../../entities/room';
import { bookingQueryKeys, scheduleQueryKeys } from '../../entities/booking';
import { intervalsOverlap } from '../../shared/lib';
import type { RealtimeActiveContext } from './activeContext';
import type { RealtimeEvent } from '../../shared/api';

export type { RealtimeActiveContext } from './activeContext';
export { parseRealtimeEvent } from '../../shared/api';

export async function applyRealtimeEvent(
  client: QueryClient,
  event: RealtimeEvent | undefined,
  activeContext: RealtimeActiveContext = {},
): Promise<void> {
  if (!event) return;

  if (event.type === 'booking.created' || event.type === 'booking.cancelled') {
    await client.invalidateQueries({ queryKey: bookingQueryKeys.all });
    if (activeContext.selectedRoom?.roomId === event.data.booking.roomId) {
      await client.invalidateQueries({
        queryKey: scheduleQueryKeys.byRoom(
          activeContext.selectedRoom.roomId,
          activeContext.selectedRoom.date,
        ),
      });
    }
    return;
  }

  if (event.type === 'room.availability_changed') {
    const roomsList = activeContext.roomsList;
    if (
      roomsList &&
      roomsList.officeId === event.data.officeId &&
      intervalsOverlap(roomsList.interval, {
        from: event.data.startsAt,
        to: event.data.endsAt,
      })
    ) {
      await client.invalidateQueries({ queryKey: roomQueryKeys.list(roomsList.filters) });
    }
    return;
  }

  await Promise.all([
    client.invalidateQueries({ queryKey: officeQueryKeys.all }),
    client.invalidateQueries({ queryKey: roomQueryKeys.all }),
    client.invalidateQueries({ queryKey: scheduleQueryKeys.all }),
    client.invalidateQueries({ queryKey: bookingQueryKeys.all }),
  ]);
}
