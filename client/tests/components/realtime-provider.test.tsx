import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { ws } from 'msw';
import { RealtimeProvider, type RealtimeSocket } from '../../src/app/realtime/RealtimeProvider';
import { bookingQueryKeys } from '../../src/entities/booking';
import { server } from '../support/server';

it('receives events through the default socket and invalidates cached bookings', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(bookingQueryKeys.all, []);
  const socketServer = ws.link('ws://localhost:3000/api/v1/ws');
  server.use(
    socketServer.addEventListener('connection', ({ client: socket }) => {
      socket.send(
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
      );
    }),
  );
  render(
    <QueryClientProvider client={client}>
      <RealtimeProvider>
        <span>content</span>
      </RealtimeProvider>
    </QueryClientProvider>,
  );

  await vi.waitFor(() =>
    expect(client.getQueryState(bookingQueryKeys.all)?.isInvalidated).toBe(true),
  );
});

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
  emit(type: 'open' | 'close' | 'error') {
    this.listeners.get(type)?.(new Event(type));
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
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: bookingQueryKeys.all }),
  );
  unmount();
  expect(socket.close).toHaveBeenCalledTimes(1);
});

it('shows connection loss and resyncs after the socket reconnects', async () => {
  vi.useFakeTimers();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidateQueries = vi.spyOn(client, 'invalidateQueries').mockResolvedValue();
  const firstSocket = new MockSocket();
  const secondSocket = new MockSocket();
  const sockets = [firstSocket, secondSocket];
  const factory = vi.fn(() => sockets.shift() ?? new MockSocket());
  const { unmount } = render(
    <QueryClientProvider client={client}>
      <RealtimeProvider socketFactory={factory}>
        <span>content</span>
      </RealtimeProvider>
    </QueryClientProvider>,
  );

  act(() => firstSocket.emit('close'));
  expect(screen.getByRole('status')).toHaveTextContent('Соединение потеряно. Переподключение...');

  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  expect(factory).toHaveBeenCalledTimes(2);

  act(() => secondSocket.emit('open'));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(invalidateQueries).toHaveBeenCalledWith();

  unmount();
  vi.useRealTimers();
});
