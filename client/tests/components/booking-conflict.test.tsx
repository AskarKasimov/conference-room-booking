import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../src/app/AppProviders';
import { BookingDialog } from '../../src/features/booking/BookingDialog';
import { useRoomScheduleQuery } from '../../src/hooks/useRoomScheduleQuery';
import { createTestQueryClient } from '../support/renderWithProviders';
import { roomFixture } from '../support/handlers';
import { server } from '../support/server';

const selection = {
  room: roomFixture,
  date: '2026-10-20',
  startTime: '10:00',
  durationMinutes: 60,
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-01T08:00:00.000Z'));
});

afterEach(() => vi.useRealTimers());

function renderBookingDialog(withSchedule = false) {
  return render(
    <AppProviders client={createTestQueryClient()}>
      {withSchedule ? <ScheduleLoader /> : null}
      <BookingDialog selection={selection} open onOpenChange={() => undefined} />
    </AppProviders>,
  );
}

function ScheduleLoader() {
  useRoomScheduleQuery('room-everest', selection.date, 'Europe/Moscow');
  return null;
}

describe('booking dialog', () => {
  it('switches to a conflict dialog returned by the server', async () => {
    const user = userEvent.setup();
    let scheduleRequests = 0;
    server.use(
      http.get('*/api/v1/rooms/room-everest/bookings', () => {
        scheduleRequests += 1;
        return HttpResponse.json({ items: [] });
      }),
      http.post('*/api/v1/bookings', () =>
        HttpResponse.json(
          { error: { code: 'BOOKING_CONFLICT', message: 'Комната уже забронирована' } },
          { status: 409 },
        ),
      ),
    );
    renderBookingDialog(true);

    await user.type(screen.getByLabelText('Тема встречи *'), 'Планирование');
    await user.click(screen.getByRole('button', { name: 'Забронировать' }));

    expect(await screen.findByRole('heading', { name: 'Время уже занято' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Выбрать другое время' })).toBeInTheDocument();
    expect(await screen.findByText(/Расписание обновлено/)).toBeInTheDocument();
    expect(scheduleRequests).toBeGreaterThanOrEqual(2);
    await user.click(screen.getByRole('button', { name: 'Выбрать другое время' }));
    expect(screen.getByLabelText('Тема встречи *')).toHaveValue('Планирование');
  });

  it('shows client validation without sending the request', async () => {
    const user = userEvent.setup();
    let requests = 0;
    server.use(
      http.post('*/api/v1/bookings', () => {
        requests += 1;
        return HttpResponse.json({});
      }),
    );
    renderBookingDialog();

    await user.click(screen.getByRole('button', { name: 'Забронировать' }));

    expect(await screen.findByText('Укажите название встречи')).toBeInTheDocument();
    expect(screen.getByLabelText('Тема встречи *')).toHaveFocus();
    expect(requests).toBe(0);
  });
});
