import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider } from '@tanstack/react-router';
import { http, HttpResponse } from 'msw';
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
  await user.selectOptions(screen.getByLabelText('Офис'), officeFixture.id);

  expect(new URL(requestedUrl).searchParams.get('scope')).toBe('past');
  expect(new URL(requestedUrl).searchParams.get('officeId')).toBe(officeFixture.id);
  expect(router.state.location.search.scope).toBe('past');
});
