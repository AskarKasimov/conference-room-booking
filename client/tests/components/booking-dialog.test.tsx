import { useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AppProviders } from '../../src/app/providers/AppProviders';
import { BookingDialog } from '../../src/features/create-booking';
import { BookingSuccessNotice } from '../../src/features/create-booking';
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

it('submits ISO timestamps and closes after a successful response', async () => {
  const user = userEvent.setup();
  let payload: Record<string, unknown> | undefined;
  server.use(
    http.post('*/api/v1/bookings', async ({ request }) => {
      payload = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json({ id: 'booking-1' }, { status: 201 });
    }),
  );
  function ControlledBookingDialog() {
    const [open, setOpen] = useState(true);
    return <BookingDialog selection={selection} open={open} onOpenChange={setOpen} />;
  }
  render(
    <AppProviders client={createTestQueryClient()}>
      <ControlledBookingDialog />
    </AppProviders>,
  );

  expect(screen.getByRole('heading', { name: 'Новое бронирование' })).toBeInTheDocument();
  expect(screen.getByText('Эверест')).toBeInTheDocument();
  expect(screen.getByText(/Бронирование на/)).toBeInTheDocument();

  await user.type(screen.getByLabelText('Тема встречи *'), 'Планирование');
  await user.click(screen.getByRole('button', { name: 'Забронировать' }));

  expect(await screen.findByRole('status')).toHaveTextContent('Бронирование создано');
  expect(screen.queryByRole('heading', { name: 'Новое бронирование' })).not.toBeInTheDocument();
  expect(
    screen.getByText('Комната Эверест, 20 октября, 10:00–11:00 (Europe/Moscow)'),
  ).toBeInTheDocument();
  expect(payload?.startsAt).toMatch(/2026-10-20T10:00:00\.000\+03:00/);
  expect(payload?.endsAt).toMatch(/2026-10-20T11:00:00\.000\+03:00/);
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
  function ControlledBookingDialog() {
    const [open, setOpen] = useState(true);
    return <BookingDialog selection={selection} open={open} onOpenChange={setOpen} />;
  }
  render(
    <AppProviders client={createTestQueryClient()}>
      <ControlledBookingDialog />
    </AppProviders>,
  );

  await user.click(screen.getByRole('combobox', { name: 'Время начала' }));
  expect(screen.getByRole('listbox')).toBeInTheDocument();
  await user.click(screen.getByRole('option', { name: '19:45' }));

  expect(screen.getByRole('combobox', { name: 'Продолжительность' })).toHaveTextContent('15 мин');
  await user.click(screen.getByRole('combobox', { name: 'Продолжительность' }));
  expect(screen.getByRole('option', { name: '15 мин (до 20:00)' })).toBeInTheDocument();
  await user.click(screen.getByRole('option', { name: '15 мин (до 20:00)' }));

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

  await user.click(screen.getByRole('button', { name: '20 Октября, Вт' }));

  expect(screen.getByRole('button', { name: '21 Октября, Ср' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '21 Октября, Ср' }));
  expect(screen.getByText(/Бронирование на Среда, 21 Октября/)).toBeInTheDocument();
});

it('shows and clears the comment validation error without sending an invalid request', async () => {
  let posts = 0;
  server.use(
    http.post('*/api/v1/bookings', () => {
      posts += 1;
      return HttpResponse.json({ id: 'booking-1' }, { status: 201 });
    }),
  );
  render(
    <AppProviders client={createTestQueryClient()}>
      <BookingDialog selection={selection} open onOpenChange={() => undefined} />
    </AppProviders>,
  );
  const comment = screen.getByLabelText('Комментарий');

  fireEvent.change(comment, { target: { value: 'x'.repeat(2001) } });
  await userEvent.setup().click(screen.getByRole('button', { name: 'Забронировать' }));

  expect(await screen.findByText('Комментарий не должен быть длиннее 2000 символов')).toBeVisible();
  expect(comment).toHaveAttribute('aria-invalid', 'true');
  expect(comment).toHaveAttribute('aria-describedby', 'booking-comment-error');
  expect(posts).toBe(0);

  fireEvent.change(comment, { target: { value: 'x'.repeat(2000) } });

  await waitFor(() =>
    expect(screen.queryByText('Комментарий не должен быть длиннее 2000 символов')).toBeNull(),
  );
});

it('rejects a previously valid interval after its start time passes while the form stays open', async () => {
  vi.useRealTimers();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-20T06:59:00.000Z'));
  let posts = 0;
  server.use(
    http.post('*/api/v1/bookings', () => {
      posts += 1;
      return HttpResponse.json({ id: 'booking-1' }, { status: 201 });
    }),
  );
  render(
    <AppProviders client={createTestQueryClient()}>
      <BookingDialog selection={selection} open onOpenChange={() => undefined} />
    </AppProviders>,
  );

  fireEvent.change(screen.getByLabelText('Тема встречи *'), {
    target: { value: 'Планирование' },
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60_000);
  });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Забронировать' }));
    await Promise.resolve();
  });

  expect(screen.getByText('Бронирование можно создать только на будущее')).toBeVisible();
  expect(posts).toBe(0);
});

it('resets to the latest schedule selection when a new form opens', async () => {
  const { rerender } = render(
    <AppProviders client={createTestQueryClient()}>
      <BookingDialog selection={selection} open={false} onOpenChange={() => undefined} />
    </AppProviders>,
  );
  rerender(
    <AppProviders client={createTestQueryClient()}>
      <BookingDialog
        selection={{ ...selection, date: '2026-10-21', startTime: '13:30', durationMinutes: 45 }}
        open
        onOpenChange={() => undefined}
      />
    </AppProviders>,
  );

  expect(await screen.findByText(/Бронирование на Среда, 21 Октября, 13:30/)).toBeInTheDocument();
  expect(screen.getByLabelText('Тема встречи *')).toHaveValue('');
});

it('opens a fresh form after a successful booking', async () => {
  const user = userEvent.setup();
  server.use(
    http.post('*/api/v1/bookings', () => HttpResponse.json({ id: 'booking-1' }, { status: 201 })),
  );
  function ControlledDialog() {
    const [open, setOpen] = useState(true);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Новое бронирование
        </button>
        <BookingDialog selection={selection} open={open} onOpenChange={setOpen} />
      </>
    );
  }
  render(
    <AppProviders client={createTestQueryClient()}>
      <ControlledDialog />
    </AppProviders>,
  );

  await user.type(screen.getByLabelText('Тема встречи *'), 'Первая встреча');
  await user.click(screen.getByRole('button', { name: 'Забронировать' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Бронирование создано');
  await user.click(screen.getByRole('button', { name: 'Новое бронирование' }));

  expect(await screen.findByRole('heading', { name: 'Новое бронирование' })).toBeInTheDocument();
  expect(screen.queryByText('Бронирование создано')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Тема встречи *')).toHaveValue('');
});

it('dismisses the successful-booking notification', async () => {
  const user = userEvent.setup();
  function Notice() {
    const [visible, setVisible] = useState(true);
    return visible ? (
      <BookingSuccessNotice
        booking={{
          roomName: 'Эверест',
          date: '2026-10-20',
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

it('automatically dismisses the successful-booking notification after three seconds', async () => {
  vi.useFakeTimers();
  function Notice() {
    const [visible, setVisible] = useState(true);
    return visible ? (
      <BookingSuccessNotice
        booking={{
          roomName: 'Эверест',
          date: '2026-10-20',
          startTime: '10:00',
          durationMinutes: 60,
          timezone: 'Europe/Moscow',
        }}
        onDismiss={() => setVisible(false)}
      />
    ) : null;
  }

  render(<Notice />);

  await act(async () => {
    await vi.advanceTimersByTimeAsync(2999);
  });
  expect(screen.getByRole('status')).toBeInTheDocument();

  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
