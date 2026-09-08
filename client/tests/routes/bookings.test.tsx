import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { delay, http, HttpResponse } from 'msw';
import { expect, it, vi } from 'vitest';
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

it('updates the past tab and sends the office filter', async () => {
  const user = userEvent.setup();
  let requestedUrl = '';
  server.use(
    http.get('*/api/v1/bookings', ({ request }) => {
      requestedUrl = request.url;
      return HttpResponse.json({ items: [] });
    }),
  );
  renderBookings();

  await user.click(await screen.findByRole('link', { name: 'Прошедшие' }));
  await user.click(screen.getByRole('combobox', { name: 'Офис' }));
  await user.click(await screen.findByRole('option', { name: officeFixture.name }));

  expect(new URL(requestedUrl).searchParams.get('scope')).toBe('past');
  expect(new URL(requestedUrl).searchParams.get('officeId')).toBe(officeFixture.id);
  expect(new URL(requestedUrl).searchParams.get('scope')).toBe('past');
});

it('moves the active underline with the booking tab', async () => {
  const user = userEvent.setup();
  server.use(http.get('*/api/v1/bookings', () => HttpResponse.json({ items: [] })));
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    if (this.matches('[aria-label="Фильтр бронирований"]')) {
      return {
        x: 100,
        y: 0,
        left: 100,
        right: 400,
        top: 0,
        bottom: 40,
        width: 300,
        height: 40,
        toJSON: () => ({}),
      };
    }
    if (this.matches('a[data-active="true"]')) {
      const upcoming = this.textContent?.startsWith('Предстоящие') ?? false;
      const left = upcoming ? 120 : 260;
      const width = upcoming ? 100 : 80;
      return {
        x: left,
        y: 0,
        left,
        right: left + width,
        top: 0,
        bottom: 40,
        width,
        height: 40,
        toJSON: () => ({}),
      };
    }
    return {
      x: 0,
      y: 0,
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      width: 0,
      height: 0,
      toJSON: () => ({}),
    };
  });

  renderBookings();
  const navigation = await screen.findByRole('navigation', { name: 'Фильтр бронирований' });
  const indicator = navigation.querySelector('[aria-hidden="true"]');

  expect(indicator).toHaveStyle({ '--indicator-left': '20px', '--indicator-width': '100px' });

  await user.click(screen.getByRole('link', { name: 'Прошедшие' }));
  await screen.findByRole('link', { name: 'Прошедшие (0)' });
  const updatedNavigation = screen.getByRole('navigation', { name: 'Фильтр бронирований' });

  await waitFor(() => {
    expect(updatedNavigation.querySelector('[aria-hidden="true"]')).toHaveStyle({
      '--indicator-left': '160px',
      '--indicator-width': '80px',
    });
  });
});

it('keeps the booking tabs mounted while the other scope loads for the first time', async () => {
  const user = userEvent.setup();
  let markPastRequestStarted!: () => void;
  const pastRequestStarted = new Promise<void>((resolve) => {
    markPastRequestStarted = resolve;
  });
  server.use(
    http.get('*/api/v1/bookings', async ({ request }) => {
      if (new URL(request.url).searchParams.get('scope') === 'past') {
        markPastRequestStarted();
        await delay(250);
      }
      return HttpResponse.json({ items: [] });
    }),
  );
  renderBookings();

  const navigation = await screen.findByRole('navigation', { name: 'Фильтр бронирований' });
  const indicator = navigation.querySelector('[aria-hidden="true"]');

  await user.click(screen.getByRole('link', { name: 'Прошедшие' }));
  await pastRequestStarted;

  expect(screen.getByRole('navigation', { name: 'Фильтр бронирований' })).toBe(navigation);
  expect(navigation.querySelector('[aria-hidden="true"]')).toBe(indicator);
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

  expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось загрузить бронирования');
  await userEvent.setup().click(screen.getByRole('button', { name: 'Повторить' }));
  expect(
    await screen.findByRole('heading', { name: 'Нет предстоящих бронирований' }),
  ).toBeInTheDocument();
  expect(requests).toBe(2);
});
