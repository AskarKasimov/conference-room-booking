import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AppProviders } from '../../src/app/providers/AppProviders';
import { AppRoutes } from '../../src/app/router';
import { createTestQueryClient } from '../support/renderWithProviders';
import { officeFixture, roomFixture } from '../support/handlers';
import { server } from '../support/server';

const roomsUrl =
  '/rooms?officeId=office-moscow&date=2026-10-16&startTime=10%3A00&duration=60&minCapacity=8';

function NavigationProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="location">{location.pathname + location.search + location.hash}</output>
      <button onClick={() => void navigate(-1)}>Назад в истории</button>
      <button onClick={() => void navigate(1)}>Вперёд в истории</button>
      <button onClick={() => void navigate('/rooms/unknown/extra')}>Неизвестный маршрут</button>
    </>
  );
}

function renderNavigation(entry = roomsUrl) {
  return render(
    <AppProviders client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[entry]}>
        <NavigationProbe />
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  );
}

function mainLink(name: string) {
  return within(screen.getByRole('navigation', { name: 'Основная навигация' })).getByRole('link', {
    name,
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-01T08:00:00.000Z'));
  server.use(
    http.get('*/api/v1/bookings', () => HttpResponse.json({ items: [] })),
    http.get('*/api/v1/rooms/room-everest', () => HttpResponse.json(roomFixture)),
    http.get('*/api/v1/rooms/room-everest/bookings', () => HttpResponse.json({ items: [] })),
  );
});

afterEach(() => vi.useRealTimers());

it('restores each section URL and its filters after switching main tabs', async () => {
  const user = userEvent.setup();
  renderNavigation();
  await screen.findByRole('heading', { name: 'Доступные переговорные в этом офисе' });

  await user.click(mainLink('Мои бронирования'));
  await user.click(await screen.findByRole('link', { name: 'Прошедшие' }));
  await user.click(screen.getByRole('combobox', { name: 'Офис' }));
  await user.click(await screen.findByRole('option', { name: officeFixture.name }));
  await user.click(screen.getByRole('button', { name: 'Выбрать период' }));
  await user.click(await screen.findByRole('button', { name: '1 октября, Чт' }));
  await user.click(screen.getByRole('button', { name: '5 октября, Пн' }));

  await user.click(mainLink('Переговорные'));
  await screen.findByRole('heading', { name: 'Доступные переговорные в этом офисе' });
  expect(screen.getByTestId('location')).toHaveTextContent(roomsUrl);
  expect(screen.getByRole('combobox', { name: 'Время начала' })).toHaveTextContent('10:00');
  expect(screen.getByRole('combobox', { name: 'Вместимость' })).toHaveTextContent('8 чел.');

  await user.click(mainLink('Мои бронирования'));
  await screen.findByRole('heading', { name: 'Мои бронирования' });
  expect(screen.getByTestId('location')).toHaveTextContent(
    '/bookings?scope=past&officeId=office-moscow&from=2026-10-01&to=2026-10-05',
  );
  expect(screen.getByRole('link', { name: 'Прошедшие (0)' })).toHaveAttribute(
    'data-active',
    'true',
  );
  expect(screen.getByRole('combobox', { name: 'Офис' })).toHaveTextContent(officeFixture.name);
  expect(screen.getByRole('button', { name: 'Выбрать период' })).toHaveTextContent(
    '1 октября — 5 октября',
  );
});

it('keeps the current filters when the active main tab is clicked', async () => {
  const user = userEvent.setup();
  renderNavigation();
  await screen.findByRole('heading', { name: 'Доступные переговорные в этом офисе' });
  await user.click(mainLink('Переговорные'));
  expect(screen.getByTestId('location')).toHaveTextContent(roomsUrl);
});

it('restores the room detail and its changed schedule date, then returns to the filtered list', async () => {
  const user = userEvent.setup();
  renderNavigation();
  await user.click(await screen.findByRole('link', { name: 'Подробнее' }));
  await screen.findByRole('heading', { name: 'Расписание на день' });
  expect(mainLink('Переговорные')).toHaveAttribute('aria-current', 'page');
  await user.click(screen.getByRole('button', { name: '16 Октября, Пт' }));
  await user.click(screen.getByRole('button', { name: '17 Октября, Сб' }));

  await user.click(mainLink('Мои бронирования'));
  await screen.findByRole('heading', { name: 'Мои бронирования' });
  await user.click(mainLink('Переговорные'));
  await screen.findByRole('heading', { name: 'Расписание на день' });
  expect(screen.getByTestId('location')).toHaveTextContent('/rooms/room-everest?date=2026-10-17');
  expect(screen.getByRole('button', { name: '17 Октября, Сб' })).toBeInTheDocument();

  const breadcrumbs = screen.getByRole('navigation', { name: 'Навигационная цепочка' });
  expect(within(breadcrumbs).getByRole('link', { name: officeFixture.name })).toHaveAttribute(
    'href',
    roomsUrl,
  );
  await user.click(within(breadcrumbs).getByRole('link', { name: 'Переговорные' }));
  await screen.findByRole('heading', { name: 'Доступные переговорные в этом офисе' });
  expect(screen.getByTestId('location')).toHaveTextContent(roomsUrl);
});

it('remembers the URL reached through Back and Forward without overriding browser history', async () => {
  const user = userEvent.setup();
  renderNavigation('/bookings?scope=past&from=2026-09-01&to=2026-09-30');
  await screen.findByRole('heading', { name: 'Мои бронирования' });
  await user.click(screen.getByRole('link', { name: 'Предстоящие' }));
  await user.click(mainLink('Переговорные'));
  await user.click(screen.getByRole('button', { name: 'Назад в истории' }));
  await user.click(screen.getByRole('button', { name: 'Назад в истории' }));
  expect(screen.getByTestId('location')).toHaveTextContent(
    '/bookings?scope=past&from=2026-09-01&to=2026-09-30',
  );
  await user.click(screen.getByRole('button', { name: 'Вперёд в истории' }));
  expect(screen.getByTestId('location')).toHaveTextContent(
    '/bookings?scope=upcoming&from=2026-09-01&to=2026-09-30',
  );
  await user.click(mainLink('Переговорные'));
  await user.click(mainLink('Мои бронирования'));
  await screen.findByRole('heading', { name: 'Мои бронирования' });
  expect(screen.getByTestId('location')).toHaveTextContent(
    '/bookings?scope=upcoming&from=2026-09-01&to=2026-09-30',
  );
});

it('remembers the normalized date when entering a room directly', async () => {
  const user = userEvent.setup();
  renderNavigation('/rooms/room-everest?date=bad');
  await screen.findByRole('heading', { name: 'Расписание на день' });
  await waitFor(() =>
    expect(screen.getByTestId('location')).toHaveTextContent('/rooms/room-everest?date=2026-10-01'),
  );
  await user.click(mainLink('Мои бронирования'));
  await screen.findByRole('heading', { name: 'Мои бронирования' });
  await user.click(mainLink('Переговорные'));
  await screen.findByRole('heading', { name: 'Расписание на день' });
  expect(screen.getByTestId('location')).toHaveTextContent('/rooms/room-everest?date=2026-10-01');
  const breadcrumbs = screen.getByRole('navigation', { name: 'Навигационная цепочка' });
  expect(within(breadcrumbs).getByRole('link', { name: 'Переговорные' })).toHaveAttribute(
    'href',
    '/rooms',
  );
});

it('does not restore an office removed by URL normalization', async () => {
  const user = userEvent.setup();
  renderNavigation('/rooms?officeId=unknown&minCapacity=8');
  await screen.findByRole('heading', { name: 'Выберите офис' });
  await waitFor(() =>
    expect(screen.getByTestId('location')).toHaveTextContent('/rooms?minCapacity=8'),
  );
  await user.click(mainLink('Мои бронирования'));
  await screen.findByRole('heading', { name: 'Мои бронирования' });
  await user.click(mainLink('Переговорные'));
  await screen.findByRole('heading', { name: 'Выберите офис' });
  expect(screen.getByTestId('location')).toHaveTextContent('/rooms?minCapacity=8');
});

it('does not replace a remembered section with an unknown nested route', async () => {
  const user = userEvent.setup();
  renderNavigation();
  await screen.findByRole('heading', { name: 'Доступные переговорные в этом офисе' });
  await user.click(screen.getByRole('button', { name: 'Неизвестный маршрут' }));
  await screen.findByRole('heading', { name: 'Страница не найдена' });
  await user.click(mainLink('Переговорные'));
  await screen.findByRole('heading', { name: 'Доступные переговорные в этом офисе' });
  expect(screen.getByTestId('location')).toHaveTextContent(roomsUrl);
});

it('does not apply remembered filters from another office to the office breadcrumb', async () => {
  const user = userEvent.setup();
  const otherOffice = { ...officeFixture, id: 'office-other', name: 'Другой офис' };
  server.use(
    http.get('*/api/v1/offices', () => HttpResponse.json({ items: [officeFixture, otherOffice] })),
    http.get('*/api/v1/rooms/room-everest', () =>
      HttpResponse.json({ ...roomFixture, officeId: otherOffice.id, office: otherOffice }),
    ),
  );
  renderNavigation();
  await user.click(await screen.findByRole('link', { name: 'Подробнее' }));
  await screen.findByRole('heading', { name: 'Расписание на день' });
  const breadcrumbs = screen.getByRole('navigation', { name: 'Навигационная цепочка' });
  await user.click(within(breadcrumbs).getByRole('link', { name: otherOffice.name }));
  await screen.findByRole('heading', { name: 'Доступные переговорные в этом офисе' });
  expect(screen.getByTestId('location').textContent).toBe('/rooms?officeId=office-other');
  expect(screen.getByRole('combobox', { name: 'Офис' })).toHaveTextContent(otherOffice.name);
  expect(screen.getByRole('combobox', { name: 'Вместимость' })).toHaveTextContent('Любая');
});
