import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';
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

  await user.type(screen.getByLabelText('Название встречи'), 'Планирование');
  await user.click(screen.getByRole('button', { name: 'Забронировать' }));

  expect(await screen.findByRole('status')).toHaveTextContent('Бронирование создано');
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

  expect(screen.getByLabelText('Продолжительность')).toHaveValue('15');
  expect(screen.getByRole('option', { name: '15 мин' })).toBeInTheDocument();

  await user.type(screen.getByLabelText('Название встречи'), 'Последний слот');
  await user.click(screen.getByRole('button', { name: 'Забронировать' }));

  expect(await screen.findByRole('status')).toBeInTheDocument();
  expect(payload?.endsAt).toMatch(/T20:00:00\.000\+03:00$/);
});
