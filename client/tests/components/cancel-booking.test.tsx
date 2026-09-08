import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';
import { AppProviders } from '../../src/app/AppProviders';
import { BookingRow } from '../../src/features/my-bookings/BookingRow';
import { createTestQueryClient } from '../../src/test/renderWithProviders';
import { officeFixture } from '../../src/test/handlers';
import { server } from '../../src/test/server';

const booking = {
  id: 'booking-1',
  roomId: 'room-everest',
  userId: 'user-1',
  title: 'Планирование',
  comment: null,
  startsAt: '2026-09-10T07:00:00.000Z',
  endsAt: '2026-09-10T08:00:00.000Z',
  createdAt: '2026-09-01T08:00:00.000Z',
  room: {
    id: 'room-everest',
    officeId: officeFixture.id,
    name: 'Эверест',
    floor: 12,
    capacity: 8,
    features: [],
  },
  office: officeFixture,
  owner: {
    id: 'user-1',
    login: 'me',
    displayName: 'Я',
    email: 'me@example.com',
    avatarUrl: null,
    initials: 'Я',
  },
};

it('requires confirmation before cancellation and does not delete on decline', async () => {
  const user = userEvent.setup();
  let deletes = 0;
  server.use(
    http.delete('*/api/v1/bookings/booking-1', () => {
      deletes += 1;
      return HttpResponse.json(null, { status: 204 });
    }),
  );
  render(
    <AppProviders client={createTestQueryClient()}>
      <BookingRow booking={booking} canCancel />
    </AppProviders>,
  );

  await user.click(screen.getByRole('button', { name: 'Отменить' }));
  expect(screen.getByRole('dialog')).toHaveTextContent('Эверест');
  await user.click(screen.getByRole('button', { name: 'Оставить' }));
  expect(deletes).toBe(0);
});

it('keeps the row and shows an API error when cancellation fails', async () => {
  const user = userEvent.setup();
  server.use(
    http.delete('*/api/v1/bookings/booking-1', () =>
      HttpResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Нельзя отменить' } },
        { status: 403 },
      ),
    ),
  );
  render(
    <AppProviders client={createTestQueryClient()}>
      <BookingRow booking={booking} canCancel />
    </AppProviders>,
  );

  await user.click(screen.getByRole('button', { name: 'Отменить' }));
  await user.click(screen.getByRole('button', { name: 'Отменить бронирование' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Нельзя отменить');
  expect(screen.getByText('Планирование')).toBeInTheDocument();
});
