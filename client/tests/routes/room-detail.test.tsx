import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider } from '@tanstack/react-router';
import { http, HttpResponse } from 'msw';
import { expect, it, vi } from 'vitest';
import { AppProviders } from '../../src/app/AppProviders';
import { createTestQueryClient } from '../../src/test/renderWithProviders';
import { officeFixture, roomFixture } from '../../src/test/handlers';
import { server } from '../../src/test/server';
import { createAppRouter } from '../../src/router';
import * as roomSearch from '../../src/features/room-search/searchParams';

const room = {
  ...roomFixture,
  features: [
    { code: 'screen', name: 'Экран' },
    { code: 'board', name: 'Доска' },
  ],
};
const booking = {
  id: 'booking-1',
  roomId: room.id,
  userId: 'user-2',
  title: 'Скрыто',
  comment: null,
  startsAt: '2026-09-10T07:30:00.000Z',
  endsAt: '2026-09-10T08:30:00.000Z',
  createdAt: '2026-09-01T08:00:00.000Z',
  room,
  office: officeFixture,
  owner: {
    id: 'user-2',
    login: 'other',
    displayName: 'Другой',
    email: 'other@example.com',
    avatarUrl: null,
    initials: 'Д',
  },
};

it('loads room details and a local workday schedule', async () => {
  let scheduleUrl = '';
  server.use(
    http.get('*/api/v1/rooms/room-everest', () => HttpResponse.json(room)),
    http.get('*/api/v1/rooms/room-everest/bookings', ({ request }) => {
      scheduleUrl = request.url;
      return HttpResponse.json({ items: [booking] });
    }),
  );
  const router = createAppRouter('/rooms/room-everest?date=2026-09-10');
  render(
    <AppProviders client={createTestQueryClient()}>
      <RouterProvider router={router} />
    </AppProviders>,
  );

  expect(await screen.findByRole('heading', { name: 'Эверест' })).toBeInTheDocument();
  const breadcrumbs = screen.getByRole('navigation', { name: 'Навигационная цепочка' });
  expect(breadcrumbs).toHaveTextContent('Переговорные');
  expect(breadcrumbs).toHaveTextContent(officeFixture.name);
  expect(breadcrumbs).toHaveTextContent("Комната 'Эверест'");
  expect(within(breadcrumbs).getByRole('link', { name: 'Переговорные' })).toHaveAttribute(
    'href',
    '/rooms',
  );
  expect(within(breadcrumbs).getByRole('link', { name: 'Переговорные' })).not.toHaveAttribute(
    'aria-current',
  );
  expect(within(breadcrumbs).getByRole('link', { name: officeFixture.name })).toHaveAttribute(
    'href',
    `/rooms?officeId=${officeFixture.id}`,
  );
  expect(
    within(breadcrumbs).getByText("Комната 'Эверест'", { selector: '[aria-current="page"]' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Расписание на день' })).toBeInTheDocument();
  expect(screen.getByText(/Экран/)).toBeInTheDocument();
  expect(await screen.findByText('Занято')).toBeInTheDocument();
  expect(new URL(scheduleUrl).searchParams.get('from')).toMatch(/T09:00:00/);
  expect(new URL(scheduleUrl).searchParams.get('to')).toMatch(/T20:00:00/);

  await userEvent
    .setup()
    .click(within(breadcrumbs).getByRole('link', { name: officeFixture.name }));
  await waitFor(() => {
    expect(router.state.location.pathname).toBe('/rooms');
    expect(router.state.location.search.officeId).toBe(officeFixture.id);
  });
});

it('uses the selected schedule date to initialize a booking after the workday', async () => {
  const getNextSlot = vi
    .spyOn(roomSearch, 'getNextSlot')
    .mockReturnValue({ date: '2026-09-09', startTime: '09:00' });
  try {
    server.use(
      http.get('*/api/v1/rooms/room-everest', () => HttpResponse.json(room)),
      http.get('*/api/v1/rooms/room-everest/bookings', () => HttpResponse.json({ items: [] })),
    );
    const router = createAppRouter('/rooms/room-everest?date=2026-09-08');
    render(
      <AppProviders client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </AppProviders>,
    );

    await screen.findByRole('heading', { name: 'Эверест' });
    await userEvent.setup().click(screen.getByRole('button', { name: 'Забронировать комнату' }));

    expect(screen.getByText(/Бронирование на 2026-09-08, 09:00/)).toBeInTheDocument();
  } finally {
    getNextSlot.mockRestore();
  }
});

it('renders an error when the room does not exist', async () => {
  server.use(
    http.get('*/api/v1/rooms/missing', () =>
      HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Комната не найдена' } },
        { status: 404 },
      ),
    ),
  );
  const router = createAppRouter('/rooms/missing');
  render(
    <AppProviders client={createTestQueryClient()}>
      <RouterProvider router={router} />
    </AppProviders>,
  );

  expect(
    await screen.findByRole('heading', { name: 'Не удалось загрузить комнату' }),
  ).toBeInTheDocument();
});
