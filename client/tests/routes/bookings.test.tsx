import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { delay, http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';
import { AppProviders } from '../../src/app/providers/AppProviders';
import { AppRoutes } from '../../src/app/router';
import { createTestQueryClient } from '../support/renderWithProviders';
import { officeFixture } from '../support/handlers';
import { server } from '../support/server';

const booking = (id: string, startsAt: string) => ({
  id,
  roomId: 'room-everest',
  userId: 'user-1',
  title: id,
  comment: null,
  startsAt,
  endsAt: new Date(Date.parse(startsAt) + 3_600_000).toISOString(),
  createdAt: startsAt,
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
});

function renderBookings(entry = '/bookings') {
  render(
    <AppProviders client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[entry]}>
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  );
}

it('requests upcoming bookings by default and sorts rows', async () => {
  let requestedUrl = '';
  server.use(
    http.get('*/api/v1/bookings', ({ request }) => {
      requestedUrl = request.url;
      return HttpResponse.json({
        items: [
          booking('later', '2026-09-12T07:00:00.000Z'),
          booking('earlier', '2026-09-10T07:00:00.000Z'),
        ],
      });
    }),
  );
  renderBookings();

  expect(await screen.findByRole('heading', { name: 'Мои бронирования' })).toBeInTheDocument();
  expect(screen.getByText('earlier')).toBeInTheDocument();
  expect(
    screen.getByText('earlier').compareDocumentPosition(screen.getByText('later')) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(new URL(requestedUrl).searchParams.get('scope')).toBe('upcoming');
});

it.each([
  ['/bookings?scope=past', ['newest', 'middle', 'oldest']],
  ['/bookings?scope=all', ['oldest', 'middle', 'newest']],
])('orders booking rows for %s', async (entry, expectedOrder) => {
  server.use(
    http.get('*/api/v1/bookings', () =>
      HttpResponse.json({
        items: [
          booking('oldest', '2026-09-10T07:00:00.000Z'),
          booking('newest', '2026-09-12T07:00:00.000Z'),
          booking('middle', '2026-09-11T07:00:00.000Z'),
        ],
      }),
    ),
  );
  renderBookings(entry);

  await screen.findByRole('heading', { name: 'Мои бронирования' });
  const rows = expectedOrder.map((id) => screen.getByRole('heading', { name: id }));
  expect(
    rows[0]!.compareDocumentPosition(rows[1]!) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(
    rows[1]!.compareDocumentPosition(rows[2]!) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
});

it('updates the past tab, selects an office, and clears it with All offices', async () => {
  const user = userEvent.setup();
  const requestedUrls: string[] = [];
  server.use(
    http.get('*/api/v1/bookings', ({ request }) => {
      requestedUrls.push(request.url);
      return HttpResponse.json({ items: [] });
    }),
  );
  renderBookings();

  await user.click(await screen.findByRole('link', { name: 'Прошедшие' }));
  await user.click(screen.getByRole('combobox', { name: 'Офис' }));
  await user.click(await screen.findByRole('option', { name: officeFixture.name }));

  await waitFor(() => {
    const latestUrl = new URL(requestedUrls.at(-1)!);
    expect(latestUrl.searchParams.get('scope')).toBe('past');
    expect(latestUrl.searchParams.get('officeId')).toBe(officeFixture.id);
  });

  await user.click(screen.getByRole('combobox', { name: 'Офис' }));
  await user.click(await screen.findByRole('option', { name: 'Все офисы' }));

  await waitFor(() => {
    const latestUrl = new URL(requestedUrls.at(-1)!);
    expect(latestUrl.searchParams.get('scope')).toBe('past');
    expect(latestUrl.searchParams.has('officeId')).toBe(false);
  });
});

it('filters bookings by a calendar date range', async () => {
  const user = userEvent.setup();
  server.use(
    http.get('*/api/v1/bookings', () =>
      HttpResponse.json({
        items: [
          booking('before', '2026-09-09T07:00:00.000Z'),
          booking('inside-start', '2026-09-10T07:00:00.000Z'),
          booking('inside-end', '2026-09-15T07:00:00.000Z'),
          booking('after', '2026-09-16T07:00:00.000Z'),
        ],
      }),
    ),
  );
  renderBookings('/bookings?scope=past');

  await user.click(await screen.findByRole('button', { name: 'Выбрать период' }));
  await user.click(screen.getByRole('button', { name: 'Предыдущий месяц' }));
  expect(screen.queryByText('Выберите начало периода')).not.toBeInTheDocument();
  await user.click(await screen.findByRole('button', { name: '10 сентября, Чт' }));
  await user.click(screen.getByRole('button', { name: '15 сентября, Вт' }));

  expect(screen.getByRole('button', { name: '16 сентября, Ср' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'before' })).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'inside-start' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'inside-end' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'after' })).not.toBeInTheDocument();
  const upcomingTab = screen.getByRole('link', { name: /Предстоящие/ });
  expect(upcomingTab).toHaveAttribute('href', expect.stringContaining('from=2026-09-10'));
  expect(upcomingTab).toHaveAttribute('href', expect.stringContaining('to=2026-09-15'));
});

it('keeps the calendar on the month where the range end was picked', async () => {
  const user = userEvent.setup();
  server.use(http.get('*/api/v1/bookings', () => HttpResponse.json({ items: [] })));
  renderBookings('/bookings?scope=past');

  await user.click(await screen.findByRole('button', { name: 'Выбрать период' }));
  await user.click(screen.getByRole('button', { name: 'Предыдущий месяц' }));
  await user.click(await screen.findByRole('button', { name: '30 сентября, Ср' }));
  await user.click(screen.getByRole('button', { name: 'Следующий месяц' }));
  await user.click(await screen.findByRole('button', { name: '2 октября, Пт' }));

  expect(screen.getByText('Октябрь 2026')).toBeInTheDocument();
});

it('keeps filters visible and delays the skeleton when switching booking scopes', async () => {
  const user = userEvent.setup();
  let markPastRequestStarted!: () => void;
  const pastRequestStarted = new Promise<void>((resolve) => {
    markPastRequestStarted = resolve;
  });
  server.use(
    http.get('*/api/v1/bookings', async ({ request }) => {
      if (new URL(request.url).searchParams.get('scope') === 'past') {
        markPastRequestStarted();
        await delay(500);
      }
      return HttpResponse.json({ items: [] });
    }),
  );
  renderBookings();

  await screen.findByRole('navigation', { name: 'Фильтр бронирований' });

  await user.click(screen.getByRole('link', { name: 'Прошедшие' }));
  await pastRequestStarted;

  expect(screen.getByRole('link', { name: 'Прошедшие' })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Прошедшие (0)' })).not.toBeInTheDocument();
  expect(screen.queryByRole('status', { name: 'Загрузка бронирований…' })).not.toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: 'Фильтр бронирований' })).toBeInTheDocument();
  expect(await screen.findByRole('status', { name: 'Загрузка бронирований…' })).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: 'Фильтр бронирований' })).toBeInTheDocument();
  expect(await screen.findByRole('link', { name: 'Прошедшие (0)' })).toBeInTheDocument();
});

it('shows the filtered booking count only in the active tab', async () => {
  const user = userEvent.setup();
  server.use(
    http.get('*/api/v1/bookings', ({ request }) => {
      const scope = new URL(request.url).searchParams.get('scope');
      return HttpResponse.json({
        items:
          scope === 'past'
            ? [booking('past-booking', '2026-09-01T07:00:00.000Z')]
            : [
                booking('upcoming-one', '2026-09-10T07:00:00.000Z'),
                booking('upcoming-two', '2026-09-12T07:00:00.000Z'),
              ],
      });
    }),
  );
  renderBookings();

  expect(await screen.findByRole('link', { name: 'Предстоящие (2)' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Прошедшие' })).toBeInTheDocument();

  await user.click(screen.getByRole('link', { name: 'Прошедшие' }));

  expect(await screen.findByRole('link', { name: 'Прошедшие (1)' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Предстоящие' })).toBeInTheDocument();
});

it('shows a loading status while bookings are pending', async () => {
  server.use(
    http.get('*/api/v1/offices', async () => {
      await delay('infinite');
      return HttpResponse.json({ items: [] });
    }),
    http.get('*/api/v1/bookings', async () => {
      await delay('infinite');
      return HttpResponse.json({ items: [] });
    }),
  );
  renderBookings();

  expect(await screen.findByRole('status', { name: 'Загрузка бронирований…' })).toBeInTheDocument();
});

it('retries a failed bookings request and renders an empty state', async () => {
  let requests = 0;
  server.use(
    http.get('*/api/v1/bookings', () => {
      requests += 1;
      return requests === 1
        ? HttpResponse.json({ error: { code: 'FAIL', message: 'Ошибка' } }, { status: 500 })
        : HttpResponse.json({ items: [] });
    }),
  );
  renderBookings();

  expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось загрузить данные');
  await userEvent.setup().click(screen.getByRole('button', { name: 'Попробовать снова' }));
  expect(await screen.findByRole('heading', { name: 'Нет бронирований' })).toBeInTheDocument();
  const emptyDescription = screen.getByText(/У вас пока нет предстоящих бронирований/);
  expect(emptyDescription).toHaveTextContent(
    'У вас пока нет предстоящих бронирований.Перейдите в раздел переговорных, чтобы забронировать комнату.',
  );
  expect(screen.getByRole('link', { name: 'Перейти к переговорным' })).toHaveAttribute(
    'href',
    '/rooms',
  );
  expect(requests).toBe(2);
});
