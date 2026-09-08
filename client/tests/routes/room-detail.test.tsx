import { render, screen } from '@testing-library/react';
import { RouterProvider } from '@tanstack/react-router';
import { http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';
import { AppProviders } from '../../src/app/AppProviders';
import { createTestQueryClient } from '../../src/test/renderWithProviders';
import { officeFixture, roomFixture } from '../../src/test/handlers';
import { server } from '../../src/test/server';
import { createAppRouter } from '../../src/router';

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
  expect(screen.getByText(/Экран/)).toBeInTheDocument();
  expect(await screen.findByText('Занято')).toBeInTheDocument();
  expect(new URL(scheduleUrl).searchParams.get('from')).toMatch(/T09:00:00/);
  expect(new URL(scheduleUrl).searchParams.get('to')).toMatch(/T20:00:00/);
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
