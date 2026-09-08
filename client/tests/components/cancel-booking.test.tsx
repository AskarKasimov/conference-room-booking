import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AppProviders } from '../../src/app/providers/AppProviders';
import { BookingRow } from '../../src/widgets/booking-list';
import styles from '../../src/entities/booking/ui/BookingCard.module.scss';
import { createTestQueryClient } from '../support/renderWithProviders';
import { officeFixture } from '../support/handlers';
import { server } from '../support/server';

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

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-01T08:00:00.000Z'));
});

afterEach(() => vi.useRealTimers());

it('renders room, floor, and time as the booking card metadata', () => {
  render(
    <AppProviders client={createTestQueryClient()}>
      <BookingRow booking={booking} canCancel currentUserId="user-1" />
    </AppProviders>,
  );

  expect(screen.getByText('Эверест')).toHaveClass(styles.roomName!);
  expect(screen.getByText('12 этаж')).toHaveClass(styles.metadataItem!);
  expect(screen.getByText('10:00–11:00 (Europe/Moscow)')).toHaveClass(styles.metadataItem!);
});

it('shows the warning, booking details, icons, and equal-priority choices before cancellation', async () => {
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
      <BookingRow booking={booking} canCancel currentUserId="user-1" />
    </AppProviders>,
  );

  await user.click(screen.getByRole('button', { name: 'Отменить' }));
  const dialog = screen.getByRole('dialog');
  expect(dialog).toHaveTextContent(
    'Это действие нельзя будет отменить. Освободившееся время станет доступно другим сотрудникам.',
  );
  expect(dialog).toHaveTextContent('Комната «Эверест», 12 этаж');
  expect(dialog).toHaveTextContent('Четверг, 10 сентября, 10:00 – 11:00 (Europe/Moscow)');
  expect(dialog.querySelectorAll('svg')).toHaveLength(2);
  expect(screen.queryByRole('button', { name: 'Закрыть' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Нет, оставить' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Да, отменить' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Нет, оставить' }));
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
      <BookingRow booking={booking} canCancel currentUserId="user-1" />
    </AppProviders>,
  );

  await user.click(screen.getByRole('button', { name: 'Отменить' }));
  await user.click(screen.getByRole('button', { name: 'Да, отменить' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Нельзя отменить');
  expect(screen.getByRole('heading', { name: 'Планирование', hidden: true })).toBeInTheDocument();
});

it('hides cancellation when a booking belongs to another user', () => {
  render(
    <AppProviders client={createTestQueryClient()}>
      <BookingRow booking={booking} canCancel currentUserId="someone-else" />
    </AppProviders>,
  );

  expect(screen.queryByRole('button', { name: 'Отменить' })).not.toBeInTheDocument();
});

it('removes cancellation at the booking start without remounting the row', async () => {
  vi.useRealTimers();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-10T06:59:00.000Z'));
  render(
    <AppProviders client={createTestQueryClient()}>
      <BookingRow booking={booking} canCancel currentUserId="user-1" />
    </AppProviders>,
  );

  expect(screen.getByRole('button', { name: 'Отменить' })).toBeInTheDocument();
  await vi.advanceTimersByTimeAsync(60_000);

  expect(screen.queryByRole('button', { name: 'Отменить' })).not.toBeInTheDocument();
});

it('refuses DELETE if the booking starts while its confirmation dialog is open', async () => {
  vi.useRealTimers();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-10T06:59:00.000Z'));
  let deletes = 0;
  server.use(
    http.delete('*/api/v1/bookings/booking-1', () => {
      deletes += 1;
      return HttpResponse.json(null, { status: 204 });
    }),
  );
  render(
    <AppProviders client={createTestQueryClient()}>
      <BookingRow booking={booking} canCancel currentUserId="user-1" />
    </AppProviders>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Отменить' }));
  await vi.advanceTimersByTimeAsync(60_000);
  fireEvent.click(screen.getByRole('button', { name: 'Да, отменить' }));

  expect(deletes).toBe(0);
  expect(screen.getByRole('alert')).toHaveTextContent('Встреча уже началась');
});
