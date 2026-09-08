import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { RealtimeProvider, type RealtimeSocket } from '../../src/realtime/RealtimeProvider';
import { queryKeys } from '../../src/lib/queryKeys';

class MockSocket implements RealtimeSocket {
  listeners = new Map<string, EventListener>();
  close = vi.fn();
  addEventListener(type: string, listener: EventListener) {
    this.listeners.set(type, listener);
  }
  removeEventListener(type: string, listener: EventListener) {
    if (this.listeners.get(type) === listener) this.listeners.delete(type);
  }
  emitMessage(data: unknown) {
    this.listeners.get('message')?.({ data } as MessageEvent);
  }
}

it('creates one socket, applies events, ignores malformed messages, and closes on unmount', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidateQueries = vi.spyOn(client, 'invalidateQueries').mockResolvedValue();
  const socket = new MockSocket();
  const factory = vi.fn(() => socket);
  const { unmount } = render(
    <QueryClientProvider client={client}>
      <RealtimeProvider socketFactory={factory}>
        <span>content</span>
      </RealtimeProvider>
    </QueryClientProvider>,
  );

  expect(factory).toHaveBeenCalledTimes(1);
  act(() => socket.emitMessage('{not-json'));
  act(() =>
    socket.emitMessage(
      JSON.stringify({
        type: 'booking.created',
        occurredAt: '2026-09-05T10:00:00.000Z',
        data: {
          booking: {
            id: 'booking-1',
            roomId: 'room-1',
            startsAt: '2026-09-10T10:00:00.000Z',
            endsAt: '2026-09-10T11:00:00.000Z',
          },
        },
      }),
    ),
  );

  await vi.waitFor(() =>
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.bookings.all }),
  );
  unmount();
  expect(socket.close).toHaveBeenCalledTimes(1);
});
