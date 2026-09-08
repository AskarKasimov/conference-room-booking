import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';
import { AppProviders } from '../../src/app/AppProviders';
import { BookingDialog } from '../../src/features/booking/BookingDialog';
import { BookingSuccessNotice } from '../../src/features/booking/BookingSuccessNotice';
import { createTestQueryClient } from '../../src/test/renderWithProviders';
import { roomFixture } from '../../src/test/handlers';
import { server } from '../../src/test/server';

const selection = {
  room: roomFixture,
  date: '2026-09-10',
  startTime: '10:00',
  durationMinutes: 60,
};

it('submits ISO timestamps and closes after a successful response', async () => {
  const user = userEvent.setup();
  let payload: Record<string, unknown> | undefined;
  let open = true;
  server.use(
    http.post('*/api/v1/bookings', async ({ request }) => {
      payload = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json({ id: 'booking-1' }, { status: 201 });
    }),
  );
  render(
    <AppProviders client={createTestQueryClient()}>
      <BookingDialog
        selection={selection}
        open={open}
        onOpenChange={(next) => {
          open = next;
        }}
      />
    </AppProviders>,
  );

  expect(screen.getByRole('heading', { name: 'Новое бронирование' })).toBeInTheDocument();
  expect(screen.getByText('Эверест')).toBeInTheDocument();
  expect(screen.getByText(/Бронирование на/)).toBeInTheDocument();

  await user.type(screen.getByLabelText('Тема встречи *'), 'Планирование');
  await user.click(screen.getByRole('button', { name: 'Забронировать' }));

  expect(await screen.findByRole('status')).toHaveTextContent('Бронирование создано');
  expect(screen.getByText('Комната Эверест, 10 сентября, 10:00–11:00 MSK')).toBeInTheDocument();
  expect(payload?.startsAt).toMatch(/2026-09-10T10:00:00\.000\+03:00/);
  expect(payload?.endsAt).toMatch(/2026-09-10T11:00:00\.000\+03:00/);
});

it('keeps the duration within the workday after moving the start to 19:45', async () => {
  const user = userEvent.setup();
  let payload: Record<string, unknown> | undefined;
  server.use(
    http.post('*/api/v1/bookings', async ({ request }) => {
      payload = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json({ id: 'booking-1' }, { status: 201 });
    }),
  );
  render(
    <AppProviders client={createTestQueryClient()}>
      <BookingDialog selection={selection} open onOpenChange={() => undefined} />
    </AppProviders>,
  );

  await user.click(screen.getByRole('combobox', { name: 'Время начала' }));
  expect(screen.getByRole('listbox')).toBeInTheDocument();
  await user.click(screen.getByRole('option', { name: '19:45' }));

  expect(screen.getByRole('combobox', { name: 'Продолжительность' })).toHaveTextContent('15 мин');
  await user.click(screen.getByRole('combobox', { name: 'Продолжительность' }));
  expect(screen.getByRole('option', { name: '15 мин' })).toBeInTheDocument();
  await user.click(screen.getByRole('option', { name: '15 мин' }));

  await user.type(screen.getByLabelText('Тема встречи *'), 'Последний слот');
  await user.click(screen.getByRole('button', { name: 'Забронировать' }));

  expect(await screen.findByRole('status')).toBeInTheDocument();
  expect(payload?.endsAt).toMatch(/T20:00:00\.000\+03:00$/);
});

it('uses the shared calendar control for the booking date', async () => {
  const user = userEvent.setup();
  render(
    <AppProviders client={createTestQueryClient()}>
      <BookingDialog selection={selection} open onOpenChange={() => undefined} />
    </AppProviders>,
  );

  await user.click(screen.getByRole('button', { name: '10 Сентября, Чт' }));

  expect(screen.getByRole('button', { name: '11 Сентября, Пт' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '11 Сентября, Пт' }));
  expect(screen.getByText(/Бронирование на 2026-09-11/)).toBeInTheDocument();
});

it('dismisses the successful-booking notification', async () => {
  const user = userEvent.setup();
  function Notice() {
    const [visible, setVisible] = useState(true);
    return visible ? (
      <BookingSuccessNotice
        booking={{
          roomName: 'Эверест',
          date: '2026-09-10',
          startTime: '10:00',
          durationMinutes: 60,
          timezone: 'Europe/Moscow',
        }}
        onDismiss={() => setVisible(false)}
      />
    ) : null;
  }

  render(<Notice />);

  await user.click(screen.getByRole('button', { name: 'Закрыть уведомление' }));

  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
