import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../../src/app/AppProviders';
import { BookingDialog } from '../../src/features/booking/BookingDialog';
import { createTestQueryClient } from '../../src/test/renderWithProviders';
import { roomFixture } from '../../src/test/handlers';
import { server } from '../../src/test/server';

const selection = {
  room: roomFixture,
  date: '2026-09-10',
  startTime: '10:00',
  durationMinutes: 60,
};

function renderBookingDialog() {
  return render(
    <AppProviders client={createTestQueryClient()}>
      <BookingDialog selection={selection} open onOpenChange={() => undefined} />
    </AppProviders>,
  );
}

describe('booking dialog', () => {
  it('switches to a conflict dialog returned by the server', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('*/api/v1/bookings', () =>
        HttpResponse.json(
          { error: { code: 'BOOKING_CONFLICT', message: 'Комната уже забронирована' } },
          { status: 409 },
        ),
      ),
    );
    renderBookingDialog();

    await user.type(screen.getByLabelText('Тема встречи *'), 'Планирование');
    await user.click(screen.getByRole('button', { name: 'Забронировать' }));

    expect(await screen.findByRole('heading', { name: 'Время уже занято' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Выбрать другое время' })).toBeInTheDocument();
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
    expect(requests).toBe(0);
  });
});
