import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../src/app/providers/AppProviders';
import { QueryClientProvider } from '@tanstack/react-query';
import { RealtimeProvider, type RealtimeSocket } from '../../src/app/realtime/RealtimeProvider';
import { createTestQueryClient } from '../support/renderWithProviders';
import { roomFixture, officeFixture } from '../support/handlers';
import { server } from '../support/server';
import { AppRoutes } from '../../src/app/router';

function renderRooms(entry = '/rooms') {
  render(
    <AppProviders client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[entry]}>
        <NavigationProbe />
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  );
}

function NavigationProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <div>
      <output data-testid="current-search">{location.search}</output>
      <output data-testid="current-pathname">{location.pathname}</output>
      <button type="button" onClick={() => void navigate(-1)}>
        History back
      </button>
      <button type="button" onClick={() => void navigate(1)}>
        History forward
      </button>
    </div>
  );
}

beforeEach(() => {
  server.use(http.get('*/api/v1/offices', () => HttpResponse.json({ items: [officeFixture] })));
});

afterEach(() => vi.useRealTimers());

describe('room search route', () => {
  it('separates the office controls from the available-rooms section', async () => {
    renderRooms(`/rooms?officeId=${officeFixture.id}`);

    expect(
      await screen.findByRole('heading', { name: 'Доступные переговорные в этом офисе' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Переговорные комнаты' })).not.toBeInTheDocument();
  });

  it('shows a dedicated no-office state and does not request rooms', async () => {
    let roomsRequested = false;
    server.use(
      http.get('*/api/v1/offices', () => HttpResponse.json({ items: [] })),
      http.get('*/api/v1/rooms', () => {
        roomsRequested = true;
        return HttpResponse.json({ items: [] });
      }),
    );

    renderRooms();

    expect(
      await screen.findByRole('heading', { name: 'Нет доступных офисов' }),
    ).toBeInTheDocument();
    expect(roomsRequested).toBe(false);
  });

  it('requires an explicit office selection before requesting rooms', async () => {
    let requestedUrl = '';
    let roomsRequested = false;
    server.use(
      http.get('*/api/v1/rooms', ({ request }) => {
        roomsRequested = true;
        requestedUrl = request.url;
        return HttpResponse.json({ items: [roomFixture] });
      }),
    );

    renderRooms();

    expect(await screen.findByRole('heading', { name: 'Выберите офис' })).toBeInTheDocument();
    expect(roomsRequested).toBe(false);
    expect(requestedUrl).toBe('');
  });

  it('shows disabled room filters and office details while no office is selected', async () => {
    renderRooms();

    expect(await screen.findByRole('heading', { name: 'Выберите офис' })).toBeInTheDocument();
    expect(screen.getByText('Адрес не выбран')).toBeInTheDocument();
    expect(screen.getByText('Местное время: ---')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Выберите дату' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Время начала' })).toHaveTextContent('—:—');
    expect(screen.getByRole('combobox', { name: 'Время начала' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Длительность' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Вместимость' })).toBeDisabled();
    expect(
      screen.getByText('Для просмотра доступных переговорных сначала выберите офис из списка выше'),
    ).toBeInTheDocument();
  });

  it('clears an unknown office from the URL without requesting it', async () => {
    let requestedOfficeId: string | null = null;
    server.use(
      http.get('*/api/v1/rooms', ({ request }) => {
        requestedOfficeId = new URL(request.url).searchParams.get('officeId');
        return HttpResponse.json({ items: [roomFixture] });
      }),
    );

    renderRooms('/rooms?officeId=unknown-office');

    expect(await screen.findByRole('heading', { name: 'Выберите офис' })).toBeInTheDocument();
    expect(requestedOfficeId).toBeNull();
    await waitFor(() =>
      expect(screen.getByTestId('current-search')).not.toHaveTextContent('officeId'),
    );
  });

  it('sends office, interval, and capacity after selecting an office', async () => {
    const user = userEvent.setup();
    let requestedUrl = '';
    server.use(
      http.get('*/api/v1/rooms', ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json({ items: [roomFixture] });
      }),
    );
    renderRooms();

    await user.click(await screen.findByRole('combobox', { name: 'Офис' }));
    await user.click(await screen.findByRole('option', { name: officeFixture.name }));
    await user.click(screen.getByRole('combobox', { name: 'Вместимость' }));
    await user.click(screen.getByRole('option', { name: '8 чел.' }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Эверест' })).toBeInTheDocument(),
    );
    expect(new URL(requestedUrl).searchParams.get('officeId')).toBe(officeFixture.id);
    expect(new URL(requestedUrl).searchParams.get('from')).toMatch(/T/);
    expect(new URL(requestedUrl).searchParams.get('to')).toMatch(/T/);
    expect(new URL(requestedUrl).searchParams.get('minCapacity')).toBe('8');
    const selectedSearch = new URLSearchParams(
      screen.getByTestId('current-search').textContent ?? '',
    );
    expect(selectedSearch.get('date')).toBeTruthy();
    expect(selectedSearch.get('startTime')).toBeTruthy();
    expect(selectedSearch.get('duration')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'History back' }));
    expect(await screen.findByRole('combobox', { name: 'Вместимость' })).toHaveTextContent('Любая');
    await user.click(screen.getByRole('button', { name: 'History forward' }));
    expect(await screen.findByRole('combobox', { name: 'Вместимость' })).toHaveTextContent(
      'Мин. 8 чел.',
    );
  });

  it('opens the room at the selected date and returns to the exact filter URL', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-05T07:00:00.000Z'));
    const user = userEvent.setup();
    let scheduleFrom = '';
    server.use(
      http.get('*/api/v1/rooms', () => HttpResponse.json({ items: [roomFixture] })),
      http.get('*/api/v1/rooms/room-everest', () => HttpResponse.json(roomFixture)),
      http.get('*/api/v1/rooms/room-everest/bookings', ({ request }) => {
        scheduleFrom = new URL(request.url).searchParams.get('from') ?? '';
        return HttpResponse.json({ items: [] });
      }),
    );
    const listUrl = `/rooms?officeId=${officeFixture.id}&date=2026-09-06&startTime=10:00&duration=60&minCapacity=8`;
    renderRooms(listUrl);

    await user.click(await screen.findByRole('link', { name: 'Подробнее' }));

    expect(await screen.findByRole('heading', { name: 'Расписание на день' })).toBeInTheDocument();
    await waitFor(() => expect(scheduleFrom).not.toBe(''));
    expect(screen.getByTestId('current-pathname')).toHaveTextContent('/rooms/room-everest');
    expect(screen.getByTestId('current-search')).toHaveTextContent('date=2026-09-06');
    expect(scheduleFrom).toMatch(/^2026-09-06T09:00:00/);

    await user.click(screen.getByRole('button', { name: 'History back' }));

    expect(
      await screen.findByRole('heading', { name: 'Доступные переговорные в этом офисе' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('current-search')).toHaveTextContent(listUrl.slice('/rooms'.length));
    expect(screen.getByRole('combobox', { name: 'Вместимость' })).toHaveTextContent('Мин. 8 чел.');
  });

  it('renders and retries an API error', async () => {
    let attempts = 0;
    server.use(
      http.get('*/api/v1/rooms', () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.json(
              { error: { code: 'FAIL', message: 'Ошибка комнат' } },
              { status: 500 },
            )
          : HttpResponse.json({ items: [roomFixture] });
      }),
    );
    renderRooms(`/rooms?officeId=${officeFixture.id}`);

    expect(
      await screen.findByRole('heading', { name: 'Не удалось загрузить комнаты' }),
    ).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Повторить' }));
    expect(await screen.findByRole('heading', { name: 'Эверест' })).toBeInTheDocument();
    expect(attempts).toBe(2);
  });

  it('refetches visible availability after a matching real-time event', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-05T07:00:00.000Z'));
    let available = true;
    let requests = 0;
    let messageListener: EventListener | undefined;
    const socket: RealtimeSocket = {
      addEventListener(type, listener) {
        if (type === 'message') messageListener = listener;
      },
      removeEventListener() {},
      close() {},
    };
    server.use(
      http.get('*/api/v1/rooms', () => {
        requests += 1;
        return HttpResponse.json({ items: [{ ...roomFixture, available }] });
      }),
    );
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RealtimeProvider socketFactory={() => socket}>
          <MemoryRouter
            initialEntries={[
              `/rooms?officeId=${officeFixture.id}&date=2026-09-10&startTime=10:00&duration=60`,
            ]}
          >
            <AppRoutes />
          </MemoryRouter>
        </RealtimeProvider>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Свободна на выбранное время')).toBeInTheDocument();
    await waitFor(() => expect(requests).toBe(1));

    act(() =>
      messageListener?.({
        data: JSON.stringify({
          type: 'room.availability_changed',
          occurredAt: '2026-09-05T07:00:00.000Z',
          data: {
            roomId: roomFixture.id,
            officeId: 'another-office',
            startsAt: '2026-09-10T10:00:00.000+03:00',
            endsAt: '2026-09-10T11:00:00.000+03:00',
            available: false,
          },
        }),
      } as MessageEvent),
    );
    await act(async () => Promise.resolve());
    expect(requests).toBe(1);

    act(() =>
      messageListener?.({
        data: JSON.stringify({
          type: 'room.availability_changed',
          occurredAt: '2026-09-05T07:00:00.000Z',
          data: {
            roomId: roomFixture.id,
            officeId: officeFixture.id,
            startsAt: '2026-09-10T11:00:00.000+03:00',
            endsAt: '2026-09-10T12:00:00.000+03:00',
            available: false,
          },
        }),
      } as MessageEvent),
    );
    await act(async () => Promise.resolve());
    expect(requests).toBe(1);

    available = false;
    act(() =>
      messageListener?.({
        data: JSON.stringify({
          type: 'room.availability_changed',
          occurredAt: '2026-09-05T07:00:00.000Z',
          data: {
            roomId: roomFixture.id,
            officeId: officeFixture.id,
            startsAt: '2026-09-10T10:00:00.000+03:00',
            endsAt: '2026-09-10T11:00:00.000+03:00',
            available: false,
          },
        }),
      } as MessageEvent),
    );

    expect(await screen.findByText('Занята на выбранное время')).toBeInTheDocument();
    expect(requests).toBe(2);
  });
});
