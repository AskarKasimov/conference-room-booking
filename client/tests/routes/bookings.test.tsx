import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider } from '@tanstack/react-router';
import { delay, http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';
import { AppProviders } from '../../src/app/AppProviders';
import { createAppRouter } from '../../src/router';
import { createTestQueryClient } from '../../src/test/renderWithProviders';
import { officeFixture } from '../../src/test/handlers';
import { server } from '../../src/test/server';

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
  const router = createAppRouter(entry);
  render(
    <AppProviders client={createTestQueryClient()}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return router;
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

it('updates the past tab and sends the office filter', async () => {
  const user = userEvent.setup();
  let requestedUrl = '';
  server.use(
    http.get('*/api/v1/bookings', ({ request }) => {
      requestedUrl = request.url;
      return HttpResponse.json({ items: [] });
    }),
  );
  const router = renderBookings();

  await user.click(await screen.findByRole('link', { name: 'Прошедшие' }));
  await user.click(screen.getByRole('combobox', { name: 'Офис' }));
  await user.click(await screen.findByRole('option', { name: officeFixture.name }));

  expect(new URL(requestedUrl).searchParams.get('scope')).toBe('past');
  expect(new URL(requestedUrl).searchParams.get('officeId')).toBe(officeFixture.id);
  expect(router.state.location.search.scope).toBe('past');
});

it('requests all bookings from the visual all-time control', async () => {
  const user = userEvent.setup();
  let requestedUrl = '';
  server.use(
    http.get('*/api/v1/bookings', ({ request }) => {
      requestedUrl = request.url;
      return HttpResponse.json({ items: [] });
    }),
  );
  const router = renderBookings();

  await user.click(await screen.findByRole('button', { name: 'За все время' }));

  expect(new URL(requestedUrl).searchParams.get('scope')).toBe('all');
  expect(router.state.location.search.scope).toBe('all');
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
