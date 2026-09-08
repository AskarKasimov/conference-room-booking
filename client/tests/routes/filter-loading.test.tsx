import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AppProviders } from '../../src/app/providers/AppProviders';
import { AppRoutes } from '../../src/app/router';
import { createTestQueryClient } from '../support/renderWithProviders';
import { roomFixture } from '../support/handlers';
import { server } from '../support/server';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-01T08:00:00Z'));
  server.use(http.get('*/api/v1/rooms/room-everest', () => HttpResponse.json(roomFixture)));
});
afterEach(() => vi.useRealTimers());

function FilterNavigation({ to }: { to: string }) {
  const navigate = useNavigate();
  return <button onClick={() => void navigate(to)}>Изменить фильтр</button>;
}

it.each([
  {
    name: 'room capacity',
    entry: '/rooms?officeId=office-moscow&date=2026-10-16&startTime=10:00&duration=60',
    next: '/rooms?officeId=office-moscow&date=2026-10-16&startTime=10:00&duration=60&minCapacity=10',
    endpoint: '*/api/v1/rooms',
    ready: 'Нет доступных переговорных',
    updated: 'Доступные переговорные в этом офисе',
    items: [roomFixture],
  },
  {
    name: 'booking office',
    entry: '/bookings',
    next: '/bookings?officeId=office-moscow',
    endpoint: '*/api/v1/bookings',
    ready: 'Нет бронирований',
    updated: 'Нет бронирований',
    items: [],
  },
  {
    name: 'schedule date',
    entry: '/rooms/room-everest?date=2026-10-16',
    next: '/rooms/room-everest?date=2026-10-17',
    endpoint: '*/api/v1/rooms/room-everest/bookings',
    ready: 'Расписание на 2026-10-16',
    updated: 'Расписание на 2026-10-17',
    items: [],
  },
])('keeps the previous view without a skeleton on a fast $name change', async (testCase) => {
  let release!: () => void;
  const response = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requests = 0;
  server.use(
    http.get(testCase.endpoint, async () => {
      requests += 1;
      if (requests > 1) await response;
      return HttpResponse.json({ items: requests > 1 ? testCase.items : [] });
    }),
  );
  render(
    <AppProviders client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[testCase.entry]}>
        <FilterNavigation to={testCase.next} />
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  );
  const view = await screen.findByRole(testCase.name === 'schedule date' ? 'region' : 'heading', {
    name: testCase.ready,
  });
  await userEvent.setup().click(screen.getByRole('button', { name: 'Изменить фильтр' }));
  await waitFor(() => expect(requests).toBe(2));
  expect(view).toBeInTheDocument();
  expect(view.closest('[inert]')).toBeInTheDocument();
  expect(screen.queryByRole('status', { name: /Загрузка/ })).not.toBeInTheDocument();
  await act(async () => {
    release();
    await response;
  });
  const updated = await screen.findByRole(
    testCase.name === 'schedule date' ? 'region' : 'heading',
    { name: testCase.updated },
  );
  await waitFor(() => expect(updated.closest('[inert]')).toBeNull());
  expect(screen.queryByRole('status', { name: /Загрузка/ })).not.toBeInTheDocument();
});
